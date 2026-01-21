import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Check, MessageSquare, Bell, Send, X, Archive, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { NotificationManager } from '@/components/NotificationManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ChatAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    loadData();

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

    // Subscribe to replies
    const unsubscribeReplies = base44.entities.ChatReply.subscribe((event) => {
      if (event.type === 'create') {
        setReplies((prev) => ({
          ...prev,
          [event.data.message_id]: [...(prev[event.data.message_id] || []), event.data]
        }));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeReplies();
    };
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      await loadMessages();
      await loadReplies();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const allReplies = await base44.entities.ChatReply.list('-created_date', 500);
      const repliesByMessage = {};
      allReplies.forEach((reply) => {
        if (!repliesByMessage[reply.message_id]) {
          repliesByMessage[reply.message_id] = [];
        }
        repliesByMessage[reply.message_id].push(reply);
      });
      setReplies(repliesByMessage);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    }
  };

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

  const archiveConversation = async (messageId) => {
    try {
      await base44.entities.ChatMessage.update(messageId, { is_archived: true });
      toast.success('Conversa arquivada');
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      toast.error('Erro ao arquivar conversa');
    }
  };

  const filterMessages = () => {
    let filtered = messages.filter(m => !m.is_archived);

    // Filtrar por status
    if (statusFilter === 'online') {
      filtered = filtered.filter(m => m.visitor_status === 'online');
    } else if (statusFilter === 'offline') {
      filtered = filtered.filter(m => m.visitor_status === 'offline');
    }

    // Filtrar por atividade
    if (activityFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(m => {
        const lastActivity = new Date(m.last_activity || m.created_date);
        const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);

        if (activityFilter === '1h') return hoursDiff <= 1;
        if (activityFilter === '24h') return hoursDiff <= 24;
        if (activityFilter === '7d') return hoursDiff <= 168;
        return true;
      });
    }

    // Ordenar por última atividade (mais recente primeiro)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.last_activity || a.created_date);
      const dateB = new Date(b.last_activity || b.created_date);
      return dateB - dateA;
    });
  };

  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const visitorMessage = messages.find(m => m.id === messageId);
      
      await base44.entities.ChatReply.create({
        message_id: messageId,
        reply_text: replyText,
        admin_email: currentUser.email
      });
      setReplyText('');
      toast.success('Resposta enviada!');

      // Notificar o visitante via web push (simulado para browsers que suportam)
      // A notificação real será acionada pelo subscription do ChatReply no ChatWidget
      if (visitorMessage) {
        console.log(`Notificação enviada para ${visitorMessage.visitor_name}`);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setIsSendingReply(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read && !m.is_archived).length;
  const filteredMessages = filterMessages();

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

      <div className="space-y-4">
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

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <div className="flex-1 min-w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do visitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="online">🟢 Online</SelectItem>
                  <SelectItem value="offline">⚫ Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-48">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Última atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer data</SelectItem>
                  <SelectItem value="1h">Últimas 1 hora</SelectItem>
                  <SelectItem value="24h">Últimas 24 horas</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {filteredMessages.length === 0 ? (
        <Card className="text-center p-8">
          <p className="text-gray-500">
            {messages.length === 0 ? 'Nenhuma mensagem ainda' : 'Nenhuma conversa corresponde aos filtros'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMessages.map((message) => (
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        {message.visitor_name}
                        <span className={`w-2 h-2 rounded-full ${message.visitor_status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} title={message.visitor_status} />
                      </CardTitle>
                      <p className="text-sm text-gray-500">{message.visitor_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!message.is_read && (
                        <Badge className="bg-yellow-100 text-yellow-800">Nova</Badge>
                      )}
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">
                          {new Date(message.created_date).toLocaleDateString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.last_activity && (
                          <span className="text-xs text-gray-500 block">
                            Última: {new Date(message.last_activity).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
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
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveConversation(message.id);
                        }}
                        className="text-xs">
                        <Archive className="w-4 h-4 mr-1" />
                        Arquivar
                      </Button>
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

                  {/* Replies Section */}
                  {replies[message.id] && replies[message.id].length > 0 && (
                    <div className="mt-4 space-y-2 bg-gray-50 p-3 rounded-lg border-l-4 border-green-600">
                      <p className="text-xs font-semibold text-gray-600 uppercase">Respostas do Admin</p>
                      {replies[message.id].map((reply) => (
                        <div key={reply.id} className="bg-white p-2 rounded text-sm text-gray-700 border-l-2 border-green-500 pl-3">
                          <p className="font-medium text-green-700">{reply.admin_email}</p>
                          <p className="text-gray-600">{reply.reply_text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(reply.created_date).toLocaleDateString('pt-BR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {selectedMessage?.id === message.id && (
                    <div className="mt-4 space-y-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        className="text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendReply(message.id)}
                          disabled={isSendingReply || !replyText.trim()}
                          className="bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4 mr-1" />
                          Responder
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMessage(null);
                            setReplyText('');
                          }}>
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}