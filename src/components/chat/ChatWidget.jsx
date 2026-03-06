import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ImageIcon, Bell, BellOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImageFile, getImageStats } from '@/components/imageOptimizer';
import { NotificationManager } from '@/components/NotificationManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasUserInfo, setHasUserInfo] = useState(false);
  const [adminReplies, setAdminReplies] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    // Carregar URL do som de notificação
    base44.entities.SiteSettings.filter({ key: 'notification_sound' }).then((settings) => {
      if (settings.length > 0 && settings[0].notification_sound_url) {
        setNotificationSoundUrl(settings[0].notification_sound_url);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && visitorName && hasUserInfo) {
      loadHistoryAndReplies();
    }
  }, [isOpen, visitorName, hasUserInfo]);

  useEffect(() => {
    if (isOpen) {
      // Inicializar notificações
      NotificationManager.init();
      
      // Verificar se notificações estão habilitadas
      const isEnabled = NotificationManager.isEnabled();
      setNotificationsEnabled(isEnabled);

      // Mostrar prompt se não foi pedido ainda
      if (!isEnabled && Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }
  }, [isOpen]);

  const loadHistoryAndReplies = async () => {
    try {
      // Carregar 50 mensagens do visitante
      const visitorMessages = await base44.entities.ChatMessage.filter({
        visitor_name: visitorName
      }, '-created_date', 50);

      setTotalMessagesCount(visitorMessages.length);
      setMessagesOffset(50);

      // Carregar todas as respostas do admin
      const allReplies = await base44.entities.ChatReply.list('-created_date', 500);
      const repliesByMessage = {};
      allReplies.forEach((reply) => {
        if (!repliesByMessage[reply.message_id]) {
          repliesByMessage[reply.message_id] = [];
        }
        repliesByMessage[reply.message_id].push(reply);
      });

      setAdminReplies(repliesByMessage);
      setMessages(visitorMessages.reverse()); // Ordenar cronologicamente (mais antigo primeiro)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (!visitorName || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const allVisitorMessages = await base44.entities.ChatMessage.filter({
        visitor_name: visitorName
      }, '-created_date', messagesOffset + 30);

      const newMessages = allVisitorMessages.slice(0, allVisitorMessages.length - messages.length);
      
      setMessages((prev) => [...newMessages.reverse(), ...prev]);
      setMessagesOffset(messagesOffset + 30);
      setTotalMessagesCount(allVisitorMessages.length);
    } catch (error) {
      console.error('Erro ao carregar mais mensagens:', error);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  // Detectar scroll infinito
  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollTop < 100 && !isLoadingMore && messages.length < totalMessagesCount) {
      loadMoreMessages();
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const granted = await NotificationManager.requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        setShowNotificationPrompt(false);
        // Enviar notificação após um pequeno delay
        setTimeout(() => {
          NotificationManager.send('Notificações ativadas!', {
            body: 'Você receberá notificações de novas mensagens no chat'
          });
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        // Atualizar mensagens se for do mesmo visitante
        if (event.data.visitor_name === visitorName) {
          setMessages((prev) => [...prev, event.data]);
        }
      }
    });

    // Subscribe to replies
    const unsubscribeReplies = base44.entities.ChatReply.subscribe((event) => {
      if (event.type === 'create') {
        setAdminReplies((prev) => ({
          ...prev,
          [event.data.message_id]: [...(prev[event.data.message_id] || []), event.data]
        }));

        // Tocar som de notificação
        if (notificationSoundUrl) {
          const audio = new Audio(notificationSoundUrl);
          audio.play().catch(() => {});
        }

        // Enviar notificação se notificações estão habilitadas
        if (notificationsEnabled) {
          NotificationManager.send('Resposta recebida!', {
            body: 'Sua mensagem recebeu uma resposta do suporte',
            tag: `chat-reply-${event.data.message_id}`
          });
        }

        // Buscar a mensagem original para obter o visitante
        base44.entities.ChatMessage.list(50).then((allMessages) => {
          const originalMessage = allMessages.find(m => m.id === event.data.message_id);
          if (originalMessage && originalMessage.visitor_name) {
            setVisitorName(originalMessage.visitor_name);
            setHasUserInfo(true);
          }
          setIsOpen(true);
        }).catch(() => {
          setIsOpen(true);
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeReplies();
    };
  }, [visitorName, notificationsEnabled]);

  // Enviar heartbeat de atividade do visitante
  React.useEffect(() => {
    if (!hasUserInfo || !isOpen) return;

    const updateActivity = async () => {
      try {
        // Atualizar última atividade das últimas mensagens do visitante
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          await base44.entities.ChatMessage.update(latestMessage.id, {
            last_activity: new Date().toISOString(),
            visitor_status: 'online'
          });
        }
      } catch (error) {
        console.log('Erro ao atualizar atividade:', error.message);
      }
    };

    // Atualizar atividade a cada 30 segundos
    const interval = setInterval(updateActivity, 30000);
    updateActivity(); // Atualizar imediatamente

    return () => clearInterval(interval);
  }, [hasUserInfo, isOpen, messages]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setSelectedImage(result.file_url);
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      alert('Erro ao processar imagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!visitorName.trim() || (!currentMessage.trim() && !selectedImage)) {
      alert('Por favor, preencha seu nome e a mensagem');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = selectedImage;

      await base44.entities.ChatMessage.create({
        visitor_name: visitorName,
        visitor_email: visitorEmail || 'not-provided@example.com',
        message: currentMessage,
        image_url: imageUrl,
        page_url: window.location.href
      });

      setCurrentMessage('');
      setSelectedImage(null);
      setHasUserInfo(true);

      // Enviar notificação de confirmação
      if (notificationsEnabled) {
        NotificationManager.send('Mensagem enviada', {
          body: 'Sua mensagem foi enviada com sucesso',
          tag: 'chat-sent'
        });
      }
      } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
      } finally {
      setIsLoading(false);
      }
  };

  return (
    <div className="fixed bottom-0 left-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-10 left-0 w-[260px] max-w-[calc(100vw-2rem)] bg-white rounded-t-md shadow-xl flex flex-col h-[350px] border border-gray-300">

            {/* Header */}
            <div className="bg-[#3b5998] text-white p-2 rounded-t-md flex justify-between items-center border-b border-[#1d3c78]">
              <h3 className="font-bold text-sm flex items-center gap-2 px-2">Suporte</h3>
              <div className="flex gap-1">
                {notificationsEnabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-blue-600"
                    title="Notificações ativadas">
                    <Bell className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-blue-600"
                  onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Notification Prompt */}
            <AnimatePresence>
              {showNotificationPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 border-b border-blue-200 p-3 text-sm">
                  <p className="text-blue-800 mb-2">Ativar notificações para não perder respostas?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEnableNotifications}
                      className="bg-blue-600 hover:bg-blue-700 text-white">
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowNotificationPrompt(false)}>
                      Agora não
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                        <div ref={messagesStartRef} />
                        
                        {isLoadingMore && (
                          <div className="flex justify-center my-2">
                            <span className="text-xs text-gray-400">⏳ Carregando mensagens antigas...</span>
                          </div>
                        )}

                        {hasUserInfo && (
                          <div className="text-center text-blue-600 text-sm font-semibold mt-4 mb-4">
                            👋 Olá, Sr(a) {visitorName}!
                          </div>
                        )}
                        {!hasUserInfo && messages.length === 0 ? (
                          <div className="text-center text-gray-500 text-sm mt-4">
                            Bem-vindo! Digite seu nome para começar.
                          </div>
                        ) : messages.length === 0 && hasUserInfo ? (
                          <div className="text-center text-gray-500 text-sm mt-4">
                            Nenhuma mensagem anterior. Deixe sua primeira mensagem!
                          </div>
                        ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs text-gray-400 px-1">
                      {msg.created_date ? format(new Date(msg.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Agora'}
                    </div>
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Imagem enviada"
                        className="max-w-full h-32 rounded-lg object-cover"
                      />
                    )}
                    {msg.message && (
                      <div className="bg-[#edf0f5] text-gray-900 border border-[#d8dfea] p-2 rounded-sm text-sm">
                        {msg.message}
                      </div>
                    )}
                    {adminReplies[msg.id] && adminReplies[msg.id].length > 0 && (
                      <div className="space-y-1">
                        {adminReplies[msg.id].map((reply) => (
                          <div key={reply.id} className="bg-white border border-gray-200 text-gray-900 p-2 rounded-sm text-sm">
                            <div className="text-xs text-green-600 mb-1">
                              📧 Resposta • {reply.created_date ? format(new Date(reply.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Agora'}
                            </div>
                            <p>{reply.reply_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-white rounded-b-lg space-y-3">
              {!hasUserInfo && (
                <>
                  <Input
                    placeholder="Seu nome"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-500"
                  />
                  <Input
                    placeholder="Seu email (opcional)"
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className="text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-500"
                  />
                </>
              )}
              {hasUserInfo && (
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  <p className="font-medium text-gray-700">{visitorName}</p>
                  {visitorEmail && visitorEmail !== 'not-provided@example.com' && (
                    <p className="text-gray-600">{visitorEmail}</p>
                  )}
                </div>
              )}

              {selectedImage && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    disabled={isLoading}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Sua mensagem..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="text-sm flex-1 bg-white text-gray-900 border-gray-300 placeholder-gray-500"
                  disabled={isLoading}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-10 h-10">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Float Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#3b5998] text-white rounded-t-md shadow-md hover:bg-[#2d4373] transition-colors px-4 py-2 flex items-center justify-center gap-2 font-bold text-sm">
        <MessageCircle className="w-4 h-4" /> Suporte
      </motion.button>
    </div>
  );
}