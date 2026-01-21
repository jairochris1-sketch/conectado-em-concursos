import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ImageIcon, Home, MessageSquare, HelpCircle, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImageFile } from '@/components/imageOptimizer';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [messages, setMessages] = useState([]);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('chatVisitorName');
    if (savedName) {
      setVisitorName(savedName);
    }
  }, []);

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
      localStorage.setItem('chatVisitorName', visitorName);
      
      await base44.entities.ChatMessage.create({
        visitor_name: visitorName,
        visitor_email: visitorEmail || 'not-provided@example.com',
        message: currentMessage,
        image_url: selectedImage,
        page_url: window.location.href
      });

      setMessages([
        ...messages,
        {
          visitor_name: visitorName,
          message: currentMessage,
          image_url: selectedImage,
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
            className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">

            {/* Header - Orange Gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute w-40 h-40 bg-white rounded-full -top-10 -right-10"></div>
                <div className="absolute w-32 h-32 bg-white rounded-full -bottom-10 -left-10"></div>
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Olá {visitorName || 'José'} 👋</h2>
                  <p className="text-orange-100 text-sm">Como podemos ajudar?</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-orange-500"
                  onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'inicio' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!visitorName && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Seu nome"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="text-sm rounded-full border-gray-300"
                    />
                    <Input
                      placeholder="Seu email (opcional)"
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      className="text-sm rounded-full border-gray-300"
                    />
                  </div>
                )}

                {/* Search Box */}
                <div className="relative mt-6">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" />
                  <Input
                    placeholder="Qual é a sua dúvida?"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    className="pl-10 rounded-full border-2 border-orange-100 focus:border-orange-500 text-sm"
                  />
                </div>

                {/* Message Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !currentMessage.trim()}
                  className="w-full bg-white border-2 border-orange-100 hover:bg-orange-50 rounded-2xl p-4 flex items-center justify-between transition-all disabled:opacity-50"
                >
                  <span className="text-gray-800 font-medium">Envie uma mensagem</span>
                  <Send className="w-5 h-5 text-orange-500" />
                </button>

                {/* Messages List */}
                <div className="mt-6 space-y-3">
                  {messages.map((msg, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-50 p-3 rounded-lg text-sm text-gray-800">
                      {msg.message}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'mensagens' ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center text-gray-500 text-sm">
                  {messages.length === 0 ? 'Nenhuma mensagem ainda' : `${messages.length} mensagem(ns)`}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center text-gray-600 text-sm">
                  Precisa de ajuda? Entre em contato com nosso suporte.
                </div>
              </div>
            )}

            {/* Bottom Tabs */}
            <div className="border-t flex items-center justify-around bg-white">
              <button
                onClick={() => setActiveTab('inicio')}
                className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-all ${
                  activeTab === 'inicio' ? 'text-orange-500 border-t-2 border-orange-500' : 'text-gray-500'
                }`}>
                <Home className="w-5 h-5" />
                <span className="text-xs font-medium">Início</span>
              </button>
              <button
                onClick={() => setActiveTab('mensagens')}
                className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-all ${
                  activeTab === 'mensagens' ? 'text-orange-500 border-t-2 border-orange-500' : 'text-gray-500'
                }`}>
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-medium">Mensagens</span>
              </button>
              <button
                onClick={() => setActiveTab('ajuda')}
                className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-all ${
                  activeTab === 'ajuda' ? 'text-orange-500 border-t-2 border-orange-500' : 'text-gray-500'
                }`}>
                <HelpCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Ajuda</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Float Button - Orange */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow w-12 h-12 flex items-center justify-center">
        <MessageCircle className="w-5 h-5" />
      </motion.button>
    </div>
  );
}