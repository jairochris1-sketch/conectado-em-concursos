import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlanAdvantagesBlock({ userPlan, hasActiveSubscription }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  // Só mostra se o usuário estiver no plano gratuito e não tiver assinatura ativa
  const shouldShow = userPlan === 'gratuito' || (!hasActiveSubscription && userPlan !== 'avancado' && userPlan !== 'padrao');
  
  if (!shouldShow || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative w-full"
        >
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white px-6 py-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
            </div>

            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="hidden md:flex flex-shrink-0 items-center justify-center w-20 h-20 bg-white/20 rounded-lg backdrop-blur-sm">
                  <div className="relative">
                    <Star className="w-10 h-10 text-yellow-300" fill="currentColor" />
                    <Zap className="w-5 h-5 text-yellow-400 absolute -bottom-1 -right-1" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      Planos
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-1">
                    Planos Premium: conheça todas as vantagens
                  </h3>
                  <p className="text-sm md:text-base text-blue-100">
                    Questões ilimitadas, área de estudos completa, provas, resumos e muito mais. Acelere sua aprovação!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Link to={createPageUrl('Subscription')}>
                  <Button 
                    size="sm"
                    className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
                  >
                    Conhecer Planos
                  </Button>
                </Link>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}