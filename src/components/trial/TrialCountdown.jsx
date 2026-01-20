import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrialCountdown({ daysRemaining, totalDays }) {
  if (!daysRemaining || daysRemaining <= 0) return null;

  const progressPercentage = ((totalDays - daysRemaining) / totalDays) * 100;
  const isLastDay = daysRemaining === 1;
  const isUrgent = daysRemaining <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 ${
        isUrgent ? 'animate-pulse' : ''
      }`}
    >
      <div
        className={`rounded-2xl shadow-2xl p-4 min-w-[280px] border-2 ${
          isLastDay
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
            : isUrgent
            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full ${
              isLastDay
                ? 'bg-red-100'
                : isUrgent
                ? 'bg-amber-100'
                : 'bg-blue-100'
            }`}
          >
            {isUrgent ? (
              <Clock
                className={`w-5 h-5 ${
                  isLastDay ? 'text-red-600' : 'text-amber-600'
                }`}
              />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-sm font-bold mb-1 ${
                isLastDay
                  ? 'text-red-800'
                  : isUrgent
                  ? 'text-amber-800'
                  : 'text-blue-800'
              }`}
            >
              {isLastDay
                ? '⚠️ Último dia de teste!'
                : '🎯 Teste Gratuito Ativo'}
            </h3>
            <p
              className={`text-xs mb-2 ${
                isLastDay
                  ? 'text-red-700'
                  : isUrgent
                  ? 'text-amber-700'
                  : 'text-blue-700'
              }`}
            >
              <strong className="text-base">
                {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
              </strong>{' '}
              restante{daysRemaining !== 1 && 's'}
            </p>
            <div className="w-full bg-white/50 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
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
        </div>
      </div>
    </motion.div>
  );
}