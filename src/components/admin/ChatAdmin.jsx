import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ChatAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessageNotification, setNewMessageNotification] = useState(null);

  useEffect(() => {
    loadMessages();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages((prev) => [event.data, ...prev]);
        
        // Mostrar notificação de nova mensagem
        setNewMessageNotification(event.data);
        toast.success(`Nova mensagem de ${event.data.visitor_name}`, {
          description: event.data.message.substring(0, 50) + '...',
          icon: <Bell className="w-4 h-4" />
        });
        
        // Remover notificação após 5 segundos
        setTimeout(() => setNewMessageNotification(null), 5000);
      } else if (event.type === 'update') {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === event.id ? event.data : msg))
        );
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((msg) => msg.id !== event.id));
      }
    });

    return unsubscribe;
  }, []);

  const loadMessages = async () => {
    try {
      const allMessages = await base44.entities.ChatMessage.list('-created_date', 100);
      setMessages(allMessages);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await base44.entities.ChatMessage.update(messageId, { is_read: true });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await base44.entities.ChatMessage.delete(messageId);
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {newMessageNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{newMessageNotification.visitor_name}</p>
                <p className="text-xs text-blue-100 line-clamp-2">{newMessageNotification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Chat de Suporte
        </h2>
        <div className="flex items-center gap-2">
          <Badge className={`${unreadCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'} text-white`}>
            {unreadCount} não lidas
          </Badge>
        </div>
      </div>

      {messages.length === 0 ? (
        <Card className="text-center p-8">
          <p className="text-gray-500">Nenhuma mensagem ainda</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedMessage(message);
                if (!message.is_read) markAsRead(message.id);
              }}
              className={`cursor-pointer transition-all ${
                !message.is_read ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-white'
              }`}>
              <Card className="hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{message.visitor_name}</CardTitle>
                      <p className="text-sm text-gray-500">{message.visitor_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!message.is_read && (
                        <Badge className="bg-yellow-100 text-yellow-800">Nova</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(message.created_date).toLocaleDateString('pt-BR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Imagem enviada"
                      className="max-w-xs h-32 rounded-lg object-cover"
                    />
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <a
                      href={message.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate max-w-xs">
                      {message.page_url}
                    </a>
                    <div className="flex gap-2">
                      {!message.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(message.id);
                          }}
                          className="text-xs">
                          <Check className="w-4 h-4 mr-1" />
                          Marcar lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(message.id);
                        }}
                        className="text-xs">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}