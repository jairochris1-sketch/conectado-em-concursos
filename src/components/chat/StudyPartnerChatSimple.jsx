import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyPartnerChatSimple({ partnerEmail, partnerName, partnerPhoto }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Carregar mensagens
        const allMessages = await base44.entities.StudyPartnerMessage.filter({});
        const filtered = allMessages.filter(msg => 
          (msg.sender_email === user.email && msg.receiver_email === partnerEmail) ||
          (msg.sender_email === partnerEmail && msg.receiver_email === user.email)
        ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

        setMessages(filtered);

        // Marcar como lidas
        if (filtered.length > 0) {
          await base44.functions.invoke('markMessagesAsRead', { 
            partner_email: partnerEmail 
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar chat:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [partnerEmail]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.StudyPartnerMessage.subscribe((event) => {
      const msg = event.data;

      // Filtrar apenas mensagens relevantes
      if (
        (msg.sender_email === currentUser.email && msg.receiver_email === partnerEmail) ||
        (msg.sender_email === partnerEmail && msg.receiver_email === currentUser.email)
      ) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, msg]);
          
          // Marcar como lida se for do parceiro
          if (msg.receiver_email === currentUser.email) {
            setTimeout(() => {
              base44.functions.invoke('markMessagesAsRead', { 
                partner_email: partnerEmail 
              });
            }, 500);
          }
        } else if (event.type === 'update') {
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
        }
      }
    });

    return unsubscribe;
  }, [currentUser, partnerEmail]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await base44.functions.invoke('sendStudyPartnerMessage', {
        receiver_email: partnerEmail,
        content: newMessage
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
        {partnerPhoto && (
          <img 
            src={partnerPhoto} 
            alt={partnerName}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{partnerName}</h3>
          <p className="text-xs text-gray-500">{partnerEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.sender_email === currentUser?.email ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_email === currentUser?.email
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.status === 'read' && msg.sender_email === currentUser?.email && '✓✓'}
                  {msg.status === 'delivered' && msg.sender_email === currentUser?.email && '✓✓'}
                  {msg.status === 'sent' && msg.sender_email === currentUser?.email && '✓'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escreva uma mensagem..."
          disabled={sending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={sending || !newMessage.trim()}
          size="icon"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}