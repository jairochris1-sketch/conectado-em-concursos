import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Subscription } from '@/entities/Subscription';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import FAQSection from '../components/faq/FAQSection';
import SocialLinks from "../components/social/SocialLinks";
import { createPageUrl } from '@/utils';

const getPlans = (cycle) => {
  if (cycle === 'monthly') {
    return [
      {
        name: 'Gratuito',
        key: 'gratuito',
        price: '0,00',
        cycleLabel: '/mês',
        description: 'Para conhecer a plataforma',
        badge: null,
        link: null,
        buttonText: 'Começar Grátis',
        features: [
          '20 questões por dia',
          'Estatísticas básicas',
          'Acesso ao Meu Painel'
        ],
        unavailableFeatures: [
          'Questões ilimitadas',
          'Provas completas',
          'Ranking de usuários',
          'Comentários da comunidade',
          'Fórum e Feed',
          'Estatísticas avançadas',
          'Simulados personalizados',
          'Flashcards',
          'IA e Edital Verticalizado'
        ],
        cardStyle: 'bg-[#0f172a] border-slate-700 text-white shadow-lg',
        headerStyle: 'text-white',
        priceStyle: 'text-white',
        buttonStyle: 'bg-slate-700 hover:bg-slate-600 text-white',
        checkColor: 'text-[#10b981]',
        xColor: 'text-slate-500'
      },
      {
        name: 'Padrão',
        key: 'padrao',
        price: '59,90',
        cycleLabel: '/mês',
        description: 'Para quem está começando',
        badge: null,
        link: 'https://www.asaas.com/c/l6rj0623rvgpqfw6',
        buttonText: 'Assinar agora',
        features: [
          'Questões ilimitadas',
          'Provas completas',
          'Ranking de usuários',
          'Comentários da comunidade',
          'Fórum e Feed'
        ],
        unavailableFeatures: [
          'Estatísticas avançadas',
          'Simulados personalizados',
          'Flashcards',
          'IA e Edital Verticalizado'
        ],
        cardStyle: 'bg-[#0f172a] border-slate-700 text-white shadow-lg',
        headerStyle: 'text-white',
        priceStyle: 'text-white',
        buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
        checkColor: 'text-[#10b981]',
        xColor: 'text-slate-500'
      },
      {
        name: 'Avançado',
        key: 'avancado',
        pricePrefix: null,
        price: '119,90',
        cycleLabel: '/mês',
        cashPrice: null,
        description: 'Para quem leva a preparação a sério',
        badge: { text: '⭐ MAIS ESCOLHIDO', style: 'bg-[#f59e0b] text-white' },
        link: 'https://www.asaas.com/c/lxdzzqgy1ojtfgky',
        buttonText: 'Assinar agora',
        features: [
          'Tudo do Padrão',
          'Estatísticas detalhadas',
          'Análise por banca',
          'Simulados personalizados',
          'Flashcards ilimitados',
          'Revisões espaçadas',
          'Resumos e PDFs',
          'Área de estudos personalizada'
        ],
        unavailableFeatures: [
          'IA avançada',
          'Edital verticalizado com IA'
        ],
        cardStyle: 'bg-[#0f172a] border-[#f59e0b] border-2 text-white relative scale-105 z-10 shadow-xl',
        headerStyle: 'text-white',
        priceStyle: 'text-white',
        buttonStyle: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
        checkColor: 'text-[#10b981]',
        xColor: 'text-slate-500'
      }
    ];
  } else if (cycle === 'quarterly') {
    return [
      {
        name: 'Avançado',
        key: 'trimestral',
        pricePrefix: null,
        price: '329,90',
        cycleLabel: '/trimestre',
        cashPrice: 'Economize R$29,80',
        description: 'Para quem leva a preparação a sério',
        badge: { text: '⭐ TRIMESTRAL', style: 'bg-[#f59e0b] text-white' },
        link: 'https://www.asaas.com/c/lxdzzqgy1ojtfgky',
        buttonText: 'Assinar agora',
        features: [
          'Tudo do Padrão',
          'Estatísticas detalhadas',
          'Análise por banca',
          'Simulados personalizados',
          'Flashcards ilimitados',
          'Revisões espaçadas',
          'Resumos e PDFs',
          'Área de estudos personalizada'
        ],
        unavailableFeatures: [
          'IA avançada',
          'Edital verticalizado com IA'
        ],
        cardStyle: 'bg-[#0f172a] border-[#f59e0b] border-2 text-white relative shadow-xl mx-auto w-full md:max-w-md',
        headerStyle: 'text-white',
        priceStyle: 'text-white',
        buttonStyle: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
        checkColor: 'text-[#10b981]',
        xColor: 'text-slate-500'
      }
    ];
  } else if (cycle === 'annual') {
    return [
      {
        name: 'Premium',
        key: 'premium',
        pricePrefix: '12x',
        price: '139,90',
        cycleLabel: '',
        cashPrice: 'ou R$1.397,00 à vista',
        description: 'Para uma preparação completa',
        badge: { text: '🔥 MELHOR CUSTO-BENEFÍCIO', style: 'bg-[#10b981] text-white' },
        link: 'https://www.asaas.com/c/45fatb35qaui9vd9',
        buttonText: 'Assinar agora',
        features: [
          'Tudo do Padrão',
          'Estatísticas detalhadas',
          'Análise por banca',
          'Simulados personalizados',
          'Flashcards ilimitados',
          'Revisões espaçadas',
          'Resumos e PDFs',
          'Área de estudos personalizada',
          'Edital Verticalizado com IA',
          'Simulado por edital',
          'Cronograma com IA',
          'Tutor IA (explicações passo a passo)',
          'Questões inéditas',
          'Simulado digital exclusivo',
          'Cursos inclusos',
          'Atualizações futuras liberadas'
        ],
        unavailableFeatures: [],
        cardStyle: 'bg-[#0f172a] border-[#10b981] border-2 text-white relative shadow-xl mx-auto w-full md:max-w-md',
        headerStyle: 'text-white',
        priceStyle: 'text-white',
        buttonStyle: 'bg-[#10b981] hover:bg-[#059669] text-white',
        checkColor: 'text-white',
        xColor: 'text-slate-500'
      }
    ];
  }
  return [];
};

const PlanCard = ({ plan, userEmail, currentPlanKey }) => {
  const isCurrentPlan = currentPlanKey === plan.key || (!currentPlanKey && plan.key === 'gratuito');

  const handleSubscribe = () => {
    if (plan.key === 'gratuito') {
      window.location.href = createPageUrl('Dashboard');
      return;
    }
    if (plan.link) {
      const url = new URL(plan.link);
      if (userEmail) {
        url.searchParams.set('email', userEmail);
      }
      window.open(url.toString(), '_blank');
    }
  };

  return (
    <div className={`rounded-2xl p-6 md:p-8 flex flex-col h-full border ${plan.cardStyle}`}>
      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap shadow-sm ${plan.badge.style}`}>
            {plan.badge.text}
          </span>
        </div>
      )}

      <div className="text-center mb-6 pt-2">
        <h3 className={`text-xl font-bold mb-4 ${plan.headerStyle}`}>{plan.name}</h3>
        
        <div className="flex items-center justify-center gap-1 mb-2">
          {plan.pricePrefix && <span className="text-2xl font-bold">{plan.pricePrefix}</span>}
          <span className={`text-4xl font-extrabold tracking-tight ${plan.priceStyle}`}>R${plan.price}</span>
          {plan.cycleLabel && <span className="text-lg opacity-80">{plan.cycleLabel}</span>}
        </div>

        {plan.description && (
          <p className="text-sm opacity-70 mb-2">{plan.description}</p>
        )}
        {plan.cashPrice && (
          <p className="text-sm font-semibold opacity-90 mb-2 text-green-500">{plan.cashPrice}</p>
        )}
      </div>

      <div className="flex-1">
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.checkColor}`} />
              <span className="text-sm leading-tight font-medium">{feature}</span>
            </li>
          ))}
          {plan.unavailableFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 opacity-50">
              <X className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.xColor}`} />
              <span className="text-sm leading-tight">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        size="lg"
        onClick={handleSubscribe}
        disabled={isCurrentPlan}
        className={`w-full py-6 text-base font-bold rounded-lg transition-transform ${isCurrentPlan ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' : `hover:scale-105 shadow-md ${plan.buttonStyle}`}`}
      >
        {isCurrentPlan ? 'Plano Atual' : plan.buttonText}
      </Button>
    </div>
  );
};

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="ml-4 text-xl text-gray-800">Carregando informações...</p>
      </div>
    );
  }

  const currentPlans = getPlans(billingCycle);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 pt-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900"
          >
            Escolha sua preparação ideal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
          >
            Acelere sua aprovação com acesso total à nossa plataforma.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-gray-200 p-1 rounded-lg flex shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-md transition-all text-sm font-semibold ${
                billingCycle === 'monthly' ?
                'bg-white text-gray-900 shadow' :
                'text-gray-600 hover:text-gray-900'}`
                }
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-6 py-2.5 rounded-md transition-all text-sm font-semibold relative ${
                billingCycle === 'quarterly' ?
                'bg-white text-gray-900 shadow' :
                'text-gray-600 hover:text-gray-900'}`
                }
              >
                Trimestral
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-md transition-all text-sm font-semibold relative ${
                billingCycle === 'annual' ?
                'bg-white text-gray-900 shadow' :
                'text-gray-600 hover:text-gray-900'}`
                }
              >
                Anual
                <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  Economize
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        <div className={`grid grid-cols-1 ${currentPlans.length === 1 ? 'place-items-center' : 'md:grid-cols-3'} gap-8 md:gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch pt-4 pb-8`}>
          {currentPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`h-full w-full ${currentPlans.length > 1 && plan.key !== 'gratuito' && plan.key !== 'padrao' ? 'lg:-mt-4' : ''}`}
            >
              <PlanCard plan={plan} userEmail={user?.email} currentPlanKey={user?.current_plan} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}