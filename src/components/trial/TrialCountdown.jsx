import React, { useState } from 'react';
import { Clock, Sparkles, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrialCountdown({ daysRemaining, totalDays }) {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!daysRemaining || daysRemaining <= 0 || !isVisible) return null;

  const progressPercentage = ((totalDays - daysRemaining) / totalDays) * 100;
  const isLastDay = daysRemaining === 1;
  const isUrgent = daysRemaining <= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 ${
          isUrgent ? 'animate-pulse' : ''
        }`}
      >
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-2xl blur-lg opacity-50 ${
              isLastDay
                ? 'bg-gradient-to-br from-red-500 to-orange-500'
                : isUrgent
                ? 'bg-gradient-to-br from-amber-500 to-yellow-500'
                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
            }`}
          />
          <div
            className={`relative rounded-2xl shadow-2xl p-4 w-[260px] border backdrop-blur-sm ${
              isLastDay
                ? 'bg-gradient-to-br from-red-500 via-orange-500 to-red-600 border-red-300/50'
                : isUrgent
                ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 border-amber-300/50'
                : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 border-blue-300/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shadow-lg ${
                  isLastDay
                    ? 'bg-white/20 backdrop-blur-md'
                    : isUrgent
                    ? 'bg-white/20 backdrop-blur-md'
                    : 'bg-white/20 backdrop-blur-md'
                }`}
              >
                {isUrgent ? (
                  <Clock className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1 text-white drop-shadow-md">
                  Teste Gratuito Ativo
                </h3>
                <p className="text-xs mb-2 text-white/90">
                  <strong className="text-lg font-extrabold text-white">
                    {daysRemaining}
                  </strong>{' '}
                  <span className="font-semibold">
                    {daysRemaining === 1 ? 'dia' : 'dias'} restante{daysRemaining !== 1 && 's'}
                  </span>
                </p>
                <div className="w-full bg-white/30 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-white shadow-inner transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/90">
                    Plano Avançado
                  </p>
                  <Shield className="w-4 h-4 text-white/80" />
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
    </motion.div>
    </AnimatePresence>
  );
}