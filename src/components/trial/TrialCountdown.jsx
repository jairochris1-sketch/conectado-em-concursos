import React, { useState } from 'react';
import { Clock, Sparkles, X } from 'lucide-react';
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
        <div
          className={`rounded-xl shadow-xl p-3 w-[240px] border-2 ${
          isLastDay
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
            : isUrgent
            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
        }`}
      >
        <div className="flex items-start gap-2">
          <div
            className={`p-1.5 rounded-full ${
              isLastDay
                ? 'bg-red-100'
                : isUrgent
                ? 'bg-amber-100'
                : 'bg-blue-100'
            }`}
          >
            {isUrgent ? (
              <Clock
                className={`w-4 h-4 ${
                  isLastDay ? 'text-red-600' : 'text-amber-600'
                }`}
              />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-xs font-bold mb-0.5 ${
                isLastDay
                  ? 'text-red-800'
                  : isUrgent
                  ? 'text-amber-800'
                  : 'text-blue-800'
              }`}
            >
              {isLastDay
                ? 'Teste Gratuito Ativo'
                : 'Teste Gratuito Ativo'}
            </h3>
            <p
              className={`text-xs mb-1.5 ${
                isLastDay
                  ? 'text-red-700'
                  : isUrgent
                  ? 'text-amber-700'
                  : 'text-blue-700'
              }`}
            >
              <strong className="text-sm">
                {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
              </strong>{' '}
              restante{daysRemaining !== 1 && 's'}
            </p>
            <div className="w-full bg-white/50 rounded-full h-1.5 mb-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isLastDay
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : isUrgent
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p
              className={`text-xs ${
                isLastDay
                  ? 'text-red-600'
                  : isUrgent
                  ? 'text-amber-600'
                  : 'text-blue-600'
              }`}
            >
              Plano Avançado
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className={`p-1 rounded-full hover:bg-white/50 transition-colors ${
              isLastDay
                ? 'text-red-600'
                : isUrgent
                ? 'text-amber-600'
                : 'text-blue-600'
            }`}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}