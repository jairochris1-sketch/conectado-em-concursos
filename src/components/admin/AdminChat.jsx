import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    loadMessages(selectedConv);
    
    const unsubscribe = base44.entities.SupportChat.subscribe((event) => {
      if (event.data?.conversation_id === selectedConv) {
        loadMessages(selectedConv);
      }
    });
    
    return unsubscribe;
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const allChats = await base44.entities.SupportChat.list();
      const uniqueConversations = [...new Set(allChats.map(c => c.conversation_id))].map(convId => {
        const convChats = allChats.filter(c => c.conversation_id === convId);
        const lastChat = convChats[convChats.length - 1];
        return {
          id: convId,
          user_email: lastChat.user_email,
          user_name: lastChat.user_name,
          lastMessage: lastChat.message,
          unreadCount: convChats.filter(c => !c.is_read && c.sender_type === 'admin').length,
          status: lastChat.status
        };
      });
      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const chats = await base44.entities.SupportChat.filter({ conversation_id: convId });
      setMessages(chats.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConv) return;

    setSendingMessage(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.SupportChat.create({
        conversation_id: selectedConv,
        user_email: user.email,
        user_name: 'Support Team',
        sender_type: 'admin',
        message: inputValue,
        is_read: true,
        status: 'open'
      });
      setInputValue('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseConversation = async () => {
    try {
      const chats = await base44.entities.SupportChat.filter({ conversation_id: selectedConv });
      for (const chat of chats) {
        await base44.entities.SupportChat.update(chat.id, { status: 'closed' });
      }
      toast.success('Conversa fechada');
      setSelectedConv(null);
      loadConversations();
    } catch (error) {
      toast.error('Erro ao fechar conversa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Conversas ({conversations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">Nenhuma conversa</p>
          ) : (
            conversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedConv(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConv === conv.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                    <p className="text-xs opacity-70 truncate">{conv.user_email}</p>
                    <p className="text-xs truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {selectedConv ? (
        <Card className="lg:col-span-2 flex flex-col h-96">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conversa</CardTitle>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCloseConversation}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fechar
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.sender_type === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <Input
              placeholder="Escreva sua resposta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendingMessage}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={sendingMessage || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : '➤'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="lg:col-span-2 flex items-center justify-center h-96">
          <p className="text-gray-500">Selecione uma conversa para responder</p>
        </Card>
      )}
    </div>
  );
}