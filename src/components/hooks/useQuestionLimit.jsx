import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { UserAnswer } from '@/entities/UserAnswer';
import { Subscription } from '@/entities/Subscription';

export function useQuestionLimit() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [questionsAnsweredToday, setQuestionsAnsweredToday] = useState(0);
  const [userPlan, setUserPlan] = useState('gratuito');
  const [loading, setLoading] = useState(true);
  const [isInTrial, setIsInTrial] = useState(false);

  const DAILY_LIMIT_FREE = 20;
  const DAILY_LIMIT_TRIAL = 5;

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

        // Verificar se está em teste gratuito (plano avançado sem assinatura ativa)
        let inTrial = false;
        if (plan === 'avancado' && user.trial_start_date) {
          const activeSubscriptions = await Subscription.filter({ 
            user_email: user.email, 
            status: 'active' 
          });
          inTrial = activeSubscriptions.length === 0;
        }
        setIsInTrial(inTrial);

        // Planos pagos (não teste) não têm limite
        if ((plan === 'padrao' || plan === 'avancado') && !inTrial) {
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
        
        // Aplicar limite baseado no tipo de plano
        const limit = inTrial ? DAILY_LIMIT_TRIAL : DAILY_LIMIT_FREE;
        setIsBlocked(count >= limit);
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
    
    const limit = isInTrial ? DAILY_LIMIT_TRIAL : DAILY_LIMIT_FREE;
    if ((userPlan === 'gratuito' || isInTrial) && newCount >= limit) {
      setIsBlocked(true);
    }
  };

  const getDailyLimit = () => {
    return isInTrial ? DAILY_LIMIT_TRIAL : DAILY_LIMIT_FREE;
  };

  return {
    isBlocked,
    questionsAnsweredToday,
    dailyLimit: getDailyLimit(),
    userPlan,
    loading,
    incrementCount,
    isInTrial,
    remainingQuestions: Math.max(0, getDailyLimit() - questionsAnsweredToday)
  };
}