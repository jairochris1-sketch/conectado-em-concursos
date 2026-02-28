import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Users, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ADMIN_EMAILS = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com', 'juniorgmj2016@gmail.com'];

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
const getColor = (email) => COLORS[email?.charCodeAt(0) % COLORS.length] || COLORS[0];

export default function AdminInternalChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const msgs = await base44.entities.AdminMessage.list('created_date', 200);
        setMessages(msgs);
      } catch (error) {
        console.error('Erro ao carregar chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const unsubscribe = base44.entities.AdminMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
      } else if (event.type === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setSelectedImage(result.file_url);
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    if (!currentUser) return;

    setIsSending(true);
    try {
      await base44.entities.AdminMessage.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        message: newMessage.trim() || '',
        image_url: selectedImage || null
      });
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.AdminMessage.delete(id);
    } catch (error) {
      toast.error('Erro ao deletar mensagem');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = format(new Date(msg.created_date), 'dd/MM/yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <Users className="w-5 h-5" />
        <div>
          <h2 className="font-bold text-sm">Chat Interno de Administradores</h2>
          <p className="text-xs text-blue-200">{ADMIN_EMAILS.length} admins • Mensagens visíveis apenas para administradores</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 px-2 bg-gray-50 dark:bg-gray-800">{date}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {dayMessages.map((msg) => {
              const isMe = msg.sender_email === currentUser?.email;
              return (
                <div key={msg.id} className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getColor(msg.sender_email)}`}>
                    {getInitials(msg.sender_name)}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[70%] group`}>
                    {!isMe && (
                      <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_name}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-600'}`}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="Imagem" className="max-w-full rounded-lg mb-2 max-h-48 object-cover" />
                      )}
                      {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </p>
                    </div>
                    {isMe && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-1"
                      >
                        excluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {selectedImage && (
        <div className="px-4 py-2 border-t bg-white dark:bg-gray-900 flex items-center gap-2">
          <div className="relative w-16 h-16">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-gray-500">Imagem selecionada</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-white dark:bg-gray-900">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <Button
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="flex-shrink-0 w-9 h-9"
        >
          {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Mensagem para admins..."
          className="flex-1"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={isSending || (!newMessage.trim() && !selectedImage)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-9 h-9"
          size="icon"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}