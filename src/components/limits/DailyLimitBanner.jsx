import { AlertTriangle, Clock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function DailyLimitBanner({ questionsAnsweredToday, dailyLimit, remainingQuestions }) {
  const isLimitReached = remainingQuestions === 0;
  const isNearLimit = remainingQuestions <= 3 && remainingQuestions > 0;

  if (!isLimitReached && !isNearLimit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-lg p-4 border-2 ${
        isLimitReached
          ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
          : 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {isLimitReached ? (
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          {isLimitReached ? (
            <>
              <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">
                🚫 Limite Diário Atingido
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                Você respondeu <strong>{questionsAnsweredToday} questões</strong> hoje e atingiu o limite de <strong>{dailyLimit} questões diárias</strong> do Plano Gratuito.
                Volte amanhã para continuar estudando ou faça upgrade agora!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to={createPageUrl('Subscription')}>
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold w-full sm:w-auto">
                    <Crown className="w-4 h-4 mr-2" />
                    Assinar Agora - Questões Ilimitadas
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                ⚠️ Quase no Limite Diário
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                Você já respondeu <strong>{questionsAnsweredToday} questões</strong> hoje. Restam apenas <strong>{remainingQuestions} questões</strong> no seu limite diário.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button variant="outline" size="sm" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/20">
                  <Crown className="w-4 h-4 mr-1" />
                  Remover Limite com Plano Premium
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}