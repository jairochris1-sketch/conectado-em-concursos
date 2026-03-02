import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, BookOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function PlanAdvantagesBlock() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await base44.entities.BannerSettings.filter({});
        if (data && data.length > 0) {
          setSettings(data[0]);
        } else {
          // Default settings if not configured
          setSettings({
            is_active: true,
            tag_text: 'Planos',
            title: 'Planos Premium: conheça todas as vantagens',
            description: 'Questões ilimitadas, área de estudos completa, provas, resumos e muito mais. Acelere sua aprovação!',
            button_text: 'Conhecer Planos',
            button_link: 'Subscription',
            bg_color: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700'
          });
        }
      } catch (error) {
        console.error("Error fetching banner settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('planAdvantagesDismissed');
    if (dismissed) {
      setIsVisible(false);
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible || isDismissed || !settings?.is_active) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3 * 60 * 1000); // 3 minutos

    return () => clearTimeout(timer);
  }, [isVisible, isDismissed, settings]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('planAdvantagesDismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed || isLoading || !settings || !settings.is_active) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative w-full"
        >
          <div className={`${settings.bg_color || 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700'} text-white px-4 py-3 md:px-6 md:py-4 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              {/* Layout Mobile */}
              <div className="md:hidden">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                      {settings.tag_text || 'Aviso'}
                    </span>
                  </div>
                  <Button
                    onClick={handleClose}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 text-xs px-2 py-1 h-auto flex-shrink-0 relative z-50 cursor-pointer"
                  >
                    Fechar
                  </Button>
                </div>
                
                <h3 className="text-base font-bold mb-1.5 leading-tight">
                  {settings.title}
                </h3>
                
                <p className="text-xs text-blue-100 mb-3 leading-relaxed">
                  {settings.description}
                </p>
                
                <Link to={createPageUrl(settings.button_link || 'Subscription')} className="block">
                  <Button 
                    size="sm"
                    className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg text-sm"
                  >
                    {settings.button_text}
                  </Button>
                </Link>
              </div>

              {/* Layout Desktop */}
              <div className="hidden md:flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 bg-white/20 rounded-lg backdrop-blur-sm">
                    <div className="relative">
                      <BookOpen className="w-10 h-10 text-white" />
                      <Pencil className="w-5 h-5 text-yellow-300 absolute -bottom-1 -right-1" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {settings.tag_text || 'Aviso'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      {settings.title}
                    </h3>
                    <p className="text-base text-blue-100">
                      {settings.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link to={createPageUrl(settings.button_link || 'Subscription')}>
                    <Button 
                      size="sm"
                      className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
                    >
                      {settings.button_text}
                    </Button>
                  </Link>

                  <Button
                    onClick={handleClose}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 relative z-50 cursor-pointer"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}