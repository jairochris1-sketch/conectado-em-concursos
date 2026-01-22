import { AlertTriangle, Clock, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DailyLimitBanner({ questionsAnsweredToday, dailyLimit, remainingQuestions }) {
  const [isVisible, setIsVisible] = useState(true);
  const isLimitReached = remainingQuestions === 0;
  const isNearLimit = remainingQuestions <= 3 && remainingQuestions > 0;

  if (!isLimitReached && !isNearLimit) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`mb-4 md:mb-6 rounded-xl overflow-hidden shadow-lg border ${
            isLimitReached
              ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 dark:from-red-900/30 dark:to-red-900/20 dark:border-red-700'
              : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 dark:from-amber-900/30 dark:to-amber-900/20 dark:border-amber-700'
          }`}
        >
          <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5">
            {isLimitReached ? (
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            ) : (
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            )}
            
            <div className="flex-1 min-w-0">
              {isLimitReached ? (
                <>
                  <h3 className="font-bold text-red-900 dark:text-red-200 mb-2 text-base md:text-lg">
                    🚫 Limite Diário Atingido
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-4 leading-relaxed">
                    Você respondeu <strong>{questionsAnsweredToday} questões</strong> hoje e atingiu o limite de <strong>20 questões diárias</strong> do Plano Gratuito.
                    <br />
                    Volte amanhã para continuar estudando ou faça upgrade agora!
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link to={createPageUrl('Subscription')} className="w-full">
                      <Button className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 text-white font-semibold w-full text-sm shadow-md hover:shadow-lg transition-all">
                        <Crown className="w-4 h-4 mr-2 flex-shrink-0" />
                        Assinar Agora - Questões Ilimitadas
                      </Button>
                    </Link>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      ✨ Acesso a resumos estratégicos, provas recentes e muito mais!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2 text-base md:text-lg">
                    ⚠️ Quase no Limite Diário
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-3 leading-relaxed">
                    Você já respondeu <strong>{questionsAnsweredToday} questões</strong> hoje. Restam apenas <strong className="text-orange-600 dark:text-orange-400">{remainingQuestions} questões</strong> no seu limite diário.
                  </p>
                  <Link to={createPageUrl('Subscription')} className="inline-block">
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                      <Crown className="w-4 h-4 mr-2 flex-shrink-0" />
                      Remover Limite com Plano Premium
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Fechar notificação"
            >
              <X className={`w-5 h-5 ${isLimitReached ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}