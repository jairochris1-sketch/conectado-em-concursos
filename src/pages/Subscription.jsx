import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Subscription } from '@/entities/Subscription';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import FAQSection from '../components/faq/FAQSection';
import SocialLinks from "../components/social/SocialLinks";
import { createPageUrl } from '@/utils';

const plans = [
  {
    name: 'Gratuito',
    key: 'gratuito',
    cycle: 'monthly',
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
    cardStyle: 'bg-white border-gray-200 text-gray-900',
    headerStyle: 'text-gray-900',
    priceStyle: 'text-gray-900',
    buttonStyle: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    checkColor: 'text-[#1e293b]',
    xColor: 'text-gray-400'
  },
  {
    name: 'Essencial',
    key: 'padrao',
    cycle: 'monthly',
    price: '59,90',
    cycleLabel: '/mês',
    description: 'Para quem está começando',
    badge: null,
    link: 'https://www.asaas.com/c/l6rj0623rvgpqfw6',
    buttonText: 'Começar Agora',
    features: [
      'Questões ilimitadas',
      'Provas completas',
      'Ranking de usuários',
      'Comentários da comunidade',
      'Fórum e Feed',
      'Lousa digital'
    ],
    unavailableFeatures: [
      'Estatísticas avançadas',
      'Simulados personalizados',
      'Flashcards',
      'IA e Edital Verticalizado'
    ],
    cardStyle: 'bg-white border-gray-200 text-gray-900',
    headerStyle: 'text-gray-900',
    priceStyle: 'text-gray-900',
    buttonStyle: 'bg-[#1e293b] hover:bg-[#0f172a] text-white',
    checkColor: 'text-[#1e293b]',
    xColor: 'text-gray-400'
  },
  {
    name: 'Avançado',
    key: 'avancado',
    cycle: 'monthly',
    price: '119,90',
    cycleLabel: '/mês',
    description: 'Para quem leva a preparação a sério',
    badge: { text: '⭐ MAIS ESCOLHIDO', style: 'bg-[#f59e0b] text-white' },
    link: 'https://www.asaas.com/c/lxdzzqgy1ojtfgky',
    buttonText: 'Quero Evoluir',
    features: [
      'Tudo do Essencial',
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
    cardStyle: 'bg-white border-[#f59e0b] border-2 text-gray-900 relative scale-105 z-10 shadow-xl',
    headerStyle: 'text-gray-900',
    priceStyle: 'text-gray-900',
    buttonStyle: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
    checkColor: 'text-[#1e293b]',
    xColor: 'text-gray-400'
  },
  {
    name: 'Avançado Anual',
    key: 'avancado_anual',
    cycle: 'annual',
    pricePrefix: '12x',
    price: '139,90',
    cycleLabel: '',
    cashPrice: 'ou R$1.397,00 à vista',
    description: '',
    badge: { text: '🔥 MELHOR CUSTO-BENEFÍCIO', style: 'bg-[#10b981] text-white' },
    link: 'https://www.asaas.com/c/45fatb35qaui9vd9',
    buttonText: 'Quero Preparação Completa',
    features: [
      'Tudo do Avançado',
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
    cardStyle: 'bg-[#0f172a] border-[#0f172a] text-white relative shadow-xl',
    headerStyle: 'text-white',
    priceStyle: 'text-white',
    buttonStyle: 'bg-[#10b981] hover:bg-[#059669] text-white',
    checkColor: 'text-white',
    xColor: 'text-gray-500'
  }
];

const PlanCard = ({ plan, userEmail }) => {
  const handleSubscribe = () => {
    if (plan.link) {
      // Append email query param if possible, although it's an external Asaas link
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
          <p className="text-sm opacity-70 mb-2">{plan.cashPrice}</p>
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
        className={`w-full py-6 text-base font-bold rounded-lg transition-transform hover:scale-105 shadow-md ${plan.buttonStyle}`}
      >
        {plan.buttonText}
      </Button>
    </div>
  );
};

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 pt-8">
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
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Acelere sua aprovação com acesso total à nossa plataforma.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch pt-4 pb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`h-full ${plan.highlight ? 'md:-mt-4' : ''}`}
            >
              <PlanCard plan={plan} userEmail={user?.email} />
            </motion.div>
          ))}
        </div>

        <FAQSection />

        <SocialLinks />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png"
                alt="Conectado em Concursos"
                className="w-20 h-20 mx-auto mb-6 object-contain"
              />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                Quem Somos
              </h2>
            </div>
            <div className="p-8 md:p-12 text-gray-700">
              <div className="space-y-6 text-lg leading-relaxed max-w-3xl mx-auto">
                <p>
                  O Conectado em Concursos nasceu da experiência real de um concurseiro que, assim como você, enfrenta diariamente os desafios da preparação para provas e seleções. Afinal, ninguém entende melhor essa jornada do que quem vive na pele a rotina de estudos e a busca pela aprovação.
                </p>
                <p>
                  Nosso site foi desenvolvido para ser <strong className="font-semibold text-indigo-600">moderno, objetivo e prático</strong>, reunindo em um só lugar as funções mais importantes e necessárias para quem estuda para concursos. Uma plataforma otimizada, pensada para facilitar o seu caminho e tornar sua preparação mais eficiente.
                </p>
                <p>
                  Aqui, você encontra proximidade e conexão com pessoas que compartilham do mesmo sonho, trocando experiências, estratégias e motivação.
                </p>
                <p>
                  Acreditamos que a melhor estratégia para conquistar sua vaga está aqui. O Conectado em Concursos é a plataforma mais atual e inovadora do mercado.
                </p>
                <p className="font-semibold text-xl md:text-2xl mt-8 text-center text-indigo-600">
                  🚀 Venha com a gente rumo à aprovação!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}