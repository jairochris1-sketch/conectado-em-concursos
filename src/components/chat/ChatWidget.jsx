import React, { useState, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImageFile, getImageStats } from '@/components/imageOptimizer';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUserInfo, setHasUserInfo] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  React.useEffect(() => {
    if (isOpen && !hasUserInfo && visitorName) {
      setHasUserInfo(true);
    }
  }, [isOpen, visitorName, hasUserInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await optimizeImageFile(file, {
        maxWidth: 800,
        quality: 75
      });
      setSelectedImage(result.file_url);
    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
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

      setMessages([
        ...messages,
        {
          visitor_name: visitorName,
          message: currentMessage,
          image_url: imageUrl,
          created_date: new Date().toISOString()
        }
      ]);

      setCurrentMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl flex flex-col h-[500px] border border-gray-200">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-lg">Suporte</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-600"
                onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  Bem-vindo! Deixe sua mensagem.
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Imagem enviada"
                        className="max-w-full h-32 rounded-lg object-cover"
                      />
                    )}
                    {msg.message && (
                      <div className="bg-blue-100 text-gray-800 p-3 rounded-lg text-sm">
                        {msg.message}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-white rounded-b-lg space-y-3">
              {!visitorName && (
                <Input
                  placeholder="Seu nome"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="text-sm"
                />
              )}
              {!visitorName && (
                <Input
                  placeholder="Seu email (opcional)"
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="text-sm"
                />
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
                  className="text-sm flex-1"
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow w-12 h-12 flex items-center justify-center">
        <MessageCircle className="w-5 h-5" />
      </motion.button>
    </div>
  );
}