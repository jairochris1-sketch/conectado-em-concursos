import React, { useState, useEffect } from 'react';
import { FAQ } from '@/entities/FAQ';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FAQSection() {
  const [faqs, setFaqs] = useState([]);
  const [openItems, setOpenItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    setIsLoading(true);
    try {
      const faqData = await FAQ.filter({ is_active: true }, 'order');
      setFaqs(faqData);
    } catch (error) {
      console.error('Erro ao carregar FAQs:', error);
    }
    setIsLoading(false);
  };

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (isLoading || faqs.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">Dúvidas frequentes</h2>
        <p className="text-gray-300">
          Sua dúvida não está aqui? <a href="mailto:conectadoemconcursos@gmail.com" className="text-blue-400 hover:underline">Fale com a gente</a>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {faqs.map((faq, index) => (
          <Collapsible 
            key={faq.id} 
            open={openItems.has(faq.id)} 
            onOpenChange={() => toggleItem(faq.id)}
          >
            <CollapsibleTrigger className="w-full px-8 py-6 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors group">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 pr-4">
                  {faq.question}
                </h3>
                <div className={`transform transition-transform duration-200 ${
                  openItems.has(faq.id) ? 'rotate-45' : 'rotate-0'
                }`}>
                  <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-8 py-6 border-b border-gray-200 bg-gray-50">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Ainda com dúvidas? Entre em contato conosco!
        </p>
      </div>
    </motion.div>
  );
}