import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const convId = `${userData.email}-${new Date().toISOString().split('T')[0]}`;
        setConversationId(convId);
        loadMessages(convId);
      } catch {
        console.log('Usuário não autenticado');
      }
    };
    loadUser();
  }, []);

  const loadMessages = async (convId) => {
    try {
      const chats = await base44.entities.SupportChat.filter({ conversation_id: convId });
      setMessages(chats.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.entities.SupportChat.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        loadMessages(conversationId);
      }
    });
    return unsubscribe;
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || !conversationId) return;

    setLoading(true);
    try {
      await base44.entities.SupportChat.create({
        conversation_id: conversationId,
        user_email: user.email,
        user_name: user.full_name || user.email,
        sender_type: 'user',
        message: inputValue,
        is_read: false,
        status: 'open'
      });
      setInputValue('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-96"
          >
            <div className="p-4 bg-blue-600 text-white rounded-t-xl flex items-center justify-between">
              <h3 className="font-bold">Suporte em Tempo Real</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm">Nenhuma mensagem ainda. Comece a conversa!</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        msg.sender_type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {msg.sender_type === 'admin' && (
                        <p className="text-xs font-bold mb-1">Suporte</p>
                      )}
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <Input
                placeholder="Escreva sua mensagem..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={loading}
                className="bg-white dark:bg-gray-700"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '➤'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}