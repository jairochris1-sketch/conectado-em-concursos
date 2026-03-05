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

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const user = await User.me();
        
        let plan = 'gratuito';
        let inTrial = false;

        // Admin não tem limite de questões
        if (user?.role === 'admin' || user?.email === 'conectadoemconcursos@gmail.com' || user?.email === 'jairochris1@gmail.com' || user?.email === 'juniorgmj2016@gmail.com') {
          plan = 'avancado';
        } else {
          try {
            const activeSubscriptions = await Subscription.filter({ user_email: user.email, status: 'active' });
            if (activeSubscriptions.length > 0) {
              const hasPremium = activeSubscriptions.some(sub => sub.plan === 'avancado' || sub.plan === 'premium' || sub.plan === 'trimestral');
              const hasStandard = activeSubscriptions.some(sub => sub.plan === 'padrao');
              plan = hasPremium ? 'avancado' : (hasStandard ? 'padrao' : activeSubscriptions[0].plan);
            } else if (user.trial_start_date) {
              plan = 'avancado';
              inTrial = true;
            }
          } catch (err) {
            console.error(err);
          }
        }
        
        setUserPlan(plan);
        setIsInTrial(inTrial);

        // Planos pagos (não teste) não têm limite
        if (plan !== 'gratuito' && plan !== 'inactive' && plan !== 'pending' && !inTrial) {
          setIsBlocked(false);
          setLoading(false);
          return;
        }

        // Se não for admin, nem plano pago (fora do trial), nem advanced trial, aplica o limite
        if (plan === 'gratuito') {
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

          // Aplicar limite apenas para plano gratuito
          setIsBlocked(count >= DAILY_LIMIT_FREE);
        }
        
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

    if (userPlan === 'gratuito' && newCount >= DAILY_LIMIT_FREE) {
      setIsBlocked(true);
    }
  };

  const getDailyLimit = () => {
    if (userPlan === 'gratuito') {
      return DAILY_LIMIT_FREE;
    } else if (isInTrial) {
      return Infinity; // Unlimited during trial
    } else if (userPlan === 'padrao' || userPlan === 'avancado') {
      return Infinity; // Unlimited for paid plans
    }
    return DAILY_LIMIT_FREE; // Default for safety
  };

  const isCommentingBlocked = isBlocked && userPlan === 'gratuito'; // Block comments if question limit is reached for free plan

  return {
    isBlocked,
    questionsAnsweredToday,
    dailyLimit: getDailyLimit(),
    userPlan,
    loading,
    incrementCount,
    isInTrial,
    isCommentingBlocked,
    remainingQuestions: Math.max(0, getDailyLimit() - questionsAnsweredToday)
  };
}