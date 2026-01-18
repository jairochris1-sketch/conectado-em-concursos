import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { UserAnswer } from '@/entities/UserAnswer';

export function useQuestionLimit() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [questionsAnsweredToday, setQuestionsAnsweredToday] = useState(0);
  const [userPlan, setUserPlan] = useState('gratuito');
  const [loading, setLoading] = useState(true);

  const DAILY_LIMIT = 10;

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const user = await User.me();
        const plan = user?.current_plan || 'gratuito';
        setUserPlan(plan);

        // Admin não tem limite de questões
        if (user?.role === 'admin') {
          setIsBlocked(false);
          setLoading(false);
          return;
        }

        // Apenas planos gratuitos têm limite
        if (plan !== 'gratuito') {
          setIsBlocked(false);
          setLoading(false);
          return;
        }

        // Buscar todas as respostas do usuário
        const allAnswers = await UserAnswer.filter({ created_by: user.email });

        // Filtrar respostas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayAnswers = allAnswers.filter(answer => {
          const answerDate = new Date(answer.created_date);
          answerDate.setHours(0, 0, 0, 0);
          return answerDate.getTime() === today.getTime();
        });

        const count = todayAnswers.length;
        setQuestionsAnsweredToday(count);
        setIsBlocked(count >= DAILY_LIMIT);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar limite de questões:', error);
        setLoading(false);
      }
    };

    checkLimit();
  }, []);

  const incrementCount = () => {
    const newCount = questionsAnsweredToday + 1;
    setQuestionsAnsweredToday(newCount);
    if (userPlan === 'gratuito' && newCount >= DAILY_LIMIT) {
      setIsBlocked(true);
    }
  };

  return {
    isBlocked,
    questionsAnsweredToday,
    dailyLimit: DAILY_LIMIT,
    userPlan,
    loading,
    incrementCount,
    remainingQuestions: Math.max(0, DAILY_LIMIT - questionsAnsweredToday)
  };
}