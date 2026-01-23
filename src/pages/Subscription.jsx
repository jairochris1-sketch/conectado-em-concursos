import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Subscription } from '@/entities/Subscription';
import { createAsaasSubscription } from '@/functions/createAsaasSubscription';
import { cancelAsaasSubscription } from '@/functions/cancelAsaasSubscription';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ArrowLeft, X, Shield, Clock, CreditCard, QrCode, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import FAQSection from '../components/faq/FAQSection';
import SocialLinks from "../components/social/SocialLinks";

const plans = [
{
  name: 'Grátis',
  key: 'gratuito',
  monthly: { price: '0,00', cycle: 'MONTHLY' },
  semiannual: { price: '0,00', cycle: 'SEMIANNUALLY' },
  annual: { price: '0,00', cycle: 'YEARLY' },
  buttonText: 'Plano Atual',
  features: [
  '20 questões por dia',
  'Estatísticas básicas'],

  unavailableFeatures: [
  'Resumos',
  'Questões ilimitadas',
  'Área de Estudos',
  'Provas',
  'Flashcards',
  'Questões inéditas',
  'Simulados',
  'Comentários da comunidade'],

  color: 'gray',
  highlight: false
},
{
  name: 'Padrão',
  key: 'padrao',
  monthly: {
    price: '39,90',
    cycle: 'MONTHLY',
    features: [
    'Questões ilimitadas',
    'Estatísticas detalhadas',
    'Criação de Flashcards ilimitados',
    'Comentários da comunidade'],

    unavailableFeatures: [
    'Resumos',
    'Área de Estudos',
    'Provas',
    'Questões inéditas']

  },
  semiannual: {
    price: '199,00',
    cycle: 'SEMIANNUALLY',
    originalPrice: '239,40',
    savings: '40,40',
    installments: '6x R$ 33,17',
    features: [
    'Questões ilimitadas',
    'Resumos de disciplinas',
    'Área de Estudos (PDFs e Materiais)',
    'Provas completas',
    'Estatísticas detalhadas',
    'Criação de Flashcards ilimitados',
    'Comentários da comunidade'],

    unavailableFeatures: [
    'Questões inéditas']

  },
  annual: {
    price: '399,00',
    cycle: 'YEARLY',
    originalPrice: '478,80',
    savings: '79,80',
    features: [
    'Questões ilimitadas',
    'Resumos de disciplinas',
    'Provas completas',
    'Estatísticas detalhadas',
    'Criação de Flashcards ilimitados',
    'Comentários da comunidade'],

    unavailableFeatures: [
    'Área de Estudos',
    'Questões inéditas']

  },
  buttonText: 'Assinar',
  color: 'teal',
  highlight: false
},
{
  name: 'Avançado',
  key: 'avancado',
  monthly: { price: '79,80', cycle: 'MONTHLY' },
  semiannual: { price: '399,00', cycle: 'SEMIANNUALLY', originalPrice: '478,80', savings: '79,80', installments: '6x R$ 66,50' },
  annual: { price: '798,00', cycle: 'YEARLY', originalPrice: '957,60', savings: '159,60' },
  buttonText: 'Assinar',
  features: [
  'Questões ilimitadas',
  'Resumos de disciplinas',
  'Área de Estudos (PDFs e Materiais)',
  'Provas completas',
  'Estatísticas avançadas',
  'Criação de Flashcards ilimitados',
  'Questões inéditas',
  'Simulados personalizados',
  'Lousa Digital',
  'Acesso a todas as funcionalidades'],

  unavailableFeatures: [],
  color: 'blue',
  highlight: true
}];


const PlanCard = ({ plan, currentPlan, onSubscribe, isLoading, loadingPlan, onCancel, isCancelling, billingCycle, cancelError, isInTrial }) => {
  const isCurrentPlan = currentPlan?.plan === plan.key && currentPlan?.status === 'active';
  const isDisabled = plan.key === 'gratuito' || isCurrentPlan || isLoading || isInTrial;

  const getCurrentPricing = () => {
    switch (billingCycle) {
      case 'semiannual':return plan.semiannual;
      case 'annual':return plan.annual;
      default:return plan.monthly;
    }
  };

  const currentPricing = getCurrentPricing();

  const getFeatures = () => {
    if (plan.key === 'padrao') {
      return currentPricing.features || plan.features;
    }
    return plan.features;
  };

  const getUnavailableFeatures = () => {
    if (plan.key === 'padrao') {
      return currentPricing.unavailableFeatures || plan.unavailableFeatures;
    }
    return plan.unavailableFeatures;
  };
  const getPriceDetail = () => {
    switch (billingCycle) {
      case 'semiannual':return '/ semestre';
      case 'annual':return '/ ano';
      default:return '/ mês';
    }
  };
  const priceDetail = getPriceDetail();

  const cardColors = {
    gray: 'bg-gray-700 border-gray-600',
    teal: 'bg-teal-600 border-teal-500',
    blue: 'bg-blue-600 border-blue-500'
  };

  const buttonColors = {
    gray: 'bg-gray-500 hover:bg-gray-400',
    teal: 'bg-white text-teal-600 hover:bg-gray-100',
    blue: 'bg-white text-blue-600 hover:bg-gray-100'
  };

  const headerColors = {
    gray: 'bg-gray-800',
    teal: 'bg-teal-700',
    blue: 'bg-blue-700'
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Plano Atual';
    if (plan.key === 'gratuito') return 'Grátis';
    return plan.buttonText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      className={`transform transition-transform duration-300 ${plan.highlight ? 'scale-105 z-10' : ''}`}>

      <Card className={`text-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 ${cardColors[plan.color]} relative`}>
        {currentPricing.savings &&
        <div className="absolute -top-3 -right-3 z-10">
            <Badge className="bg-green-500 text-white shadow-lg text-sm px-3 py-1 rounded-full rotate-6">
              Economize R${currentPricing.savings}
            </Badge>
          </div>
        }

        <CardHeader className={`text-center p-6 ${headerColors[plan.color]}`}>
          <CardTitle className="text-2xl font-bold uppercase tracking-wider">{plan.name}</CardTitle>
          {isCurrentPlan &&
          <div className="mt-2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                Ativo
              </span>
            </div>
          }
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            {(billingCycle === 'semiannual' || billingCycle === 'annual') && currentPricing.originalPrice &&
            <div className="mb-2">
                <span className="text-sm line-through opacity-60">
                  De R${currentPricing.originalPrice}
                </span>
              </div>
            }
            
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold">R${currentPricing.price}</span>
              <span className="text-lg opacity-70">{priceDetail}</span>
            </div>
            
            {billingCycle === 'semiannual' && currentPricing.installments &&
            <div className="text-center mt-2">
                <span className="text-lg font-semibold text-yellow-300">
                  {currentPricing.installments}
                </span>
              </div>
            }
          </div>
          <ul className="space-y-4">
            {getFeatures().map((feature, index) =>
            <li key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-teal-400" />
                <span className="text-base">{feature}</span>
              </li>
            )}
            {getUnavailableFeatures() && getUnavailableFeatures().map((feature, index) =>
            <li key={index} className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-gray-400" />
                <span className="text-base line-through">{feature}</span>
              </li>
            )}
          </ul>
        </CardContent>
        <CardFooter className="p-6 bg-black bg-opacity-10 flex flex-col gap-3">
          <Button
            size="lg"
            disabled={isDisabled}
            className={`w-full text-lg font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 ${
            isDisabled ? 'bg-gray-400 cursor-not-allowed' : buttonColors[plan.color]}`
            }
            onClick={() => onSubscribe(plan.key, billingCycle)}>

            {isLoading && loadingPlan === `${plan.key}-${billingCycle}` ?
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </> :
            isInTrial && plan.key !== 'gratuito' ?
            'Disponível após o teste' :
            getButtonText()
            }
          </Button>
          {isCurrentPlan && plan.key !== 'gratuito' && currentPlan?.billing_type === 'CREDIT_CARD' &&
          <>
              <Button
              size="sm"
              variant="destructive"
              className="w-full bg-red-800 hover:bg-red-700"
              onClick={onCancel}
              disabled={isCancelling}>

                {isCancelling ?
              <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </> :

              'Cancelar Assinatura'
              }
              </Button>
              {cancelError &&
            <p className="text-xs text-red-300 mt-2 text-center">{cancelError}</p>
            }
            </>
          }
        </CardFooter>
      </Card>
    </motion.div>);

};

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [billingCycle, setBillingCycle] = useState('semiannual');
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [missingData, setMissingData] = useState({
    cpf: '',
    phone: ''
  });
  const [showPendingBanner, setShowPendingBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState(null);
  const [cpfError, setCpfError] = useState('');

  const validateCPF = (cpf) => {
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - sum % 11;
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    digit = 11 - sum % 11;
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  };

  const formatCPF = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 3) return cleanValue;
    if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
    if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  };

  const handleCPFChange = (value) => {
    const formatted = formatCPF(value);
    setMissingData((prev) => ({ ...prev, cpf: formatted }));

    const cleanCpf = value.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      if (!validateCPF(cleanCpf)) {
        setCpfError('CPF inválido. Verifique os números digitados.');
      } else {
        setCpfError('');
      }
    } else if (cleanCpf.length > 0) {
      setCpfError('');
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData.current_plan === 'avancado' && userData.trial_start_date) {
          const activeSubscriptions = await Subscription.filter({
            user_email: userData.email,
            status: 'active'
          });

          if (activeSubscriptions.length === 0) {
            const trialStartDate = new Date(userData.trial_start_date);
            const now = new Date();
            const diffTime = now.getTime() - trialStartDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            const trialDuration = 5;
            const daysRemaining = Math.ceil(trialDuration - diffDays);

            if (daysRemaining > 0) {
              setTrialInfo({
                daysRemaining,
                totalDays: trialDuration
              });
            }
          }
        }

        const subscriptions = await Subscription.filter({ user_email: userData.email });
        if (subscriptions.length > 0) {
          setCurrentSubscription(subscriptions[0]);
        } else {
          setCurrentSubscription(null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  const checkMissingData = (userData) => {
    const missing = {};
    if (!userData.cpf) missing.cpf = true;
    if (!userData.phone) missing.phone = true;
    return missing;
  };

  const handleSubscribe = async (planKey, cycle) => {
    if (planKey === 'gratuito') return;

    if (trialInfo && trialInfo.daysRemaining > 0) {
      const confirmSubscription = confirm(
        `Você ainda tem ${trialInfo.daysRemaining} dias de teste gratuito do Plano Avançado!\n\n` +
        `Ao assinar agora, você perderá o restante do seu período de teste.\n\n` +
        `Deseja continuar com a assinatura mesmo assim?`
      );

      if (!confirmSubscription) {
        return;
      }
    }

    const missing = checkMissingData(user);

    if (Object.keys(missing).length > 0) {
      setMissingData({
        cpf: user?.cpf || '',
        phone: user?.phone || ''
      });
      setSelectedPlan({ key: planKey, cycle });
      setShowQuickForm(true);
      return;
    }

    // Mostrar tela de seleção de método de pagamento
    setSelectedPlan({ key: planKey, cycle });
    setShowPaymentMethod(true);
  };

  const processSubscription = async (planKey, cycle, paymentMethod) => {
    setIsSubmitting(true);
    setLoadingPlan(`${planKey}-${cycle}`);

    try {
      const billingTypeMap = {
        'PIX': 'PIX',
        'BOLETO': 'BOLETO',
        'CREDIT_CARD': 'CREDIT_CARD'
      };

      const response = await createAsaasSubscription({
        plan: planKey,
        cycle: cycle,
        billingType: billingTypeMap[paymentMethod] || 'UNDEFINED',
        customerData: {
          name: user?.full_name || '',
          email: user?.email || '',
          cpf: user?.cpf || missingData.cpf,
          phone: user?.phone || missingData.phone
        }
      });

      if (response.data.success) {
        // Verificar se tem URL de pagamento
        const paymentUrl = response.data.payment_url ||
        response.data.boleto_url || (
        response.data.pix_code ? response.data.payment_url : null);

        if (paymentUrl) {
          // Redirecionar para a página de pagamento do Asaas em nova aba
          window.open(paymentUrl, '_blank');
          alert('Uma nova aba foi aberta com os detalhes do pagamento. Se não abriu, verifique se o bloqueador de pop-ups está ativo.');
        } else {
          alert('Assinatura criada! Aguarde a confirmação do pagamento.');
        }

        // Recarregar a página após alguns segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(response.data.error || 'Erro ao processar assinatura');
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      alert(`Erro ao processar assinatura: ${error.message || 'Tente novamente.'}`);
    }

    setIsSubmitting(false);
    setLoadingPlan(null);
    setShowQuickForm(false);
    setShowPaymentMethod(false);
  };

  const handleQuickFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = {};
      if (missingData.cpf && !user?.cpf) updateData.cpf = missingData.cpf;
      if (missingData.phone && !user?.phone) updateData.phone = missingData.phone;

      if (Object.keys(updateData).length > 0) {
        await User.updateMyUserData(updateData);
        setUser((prev) => ({ ...prev, ...updateData }));
      }

      // Após salvar dados, ir para seleção de método de pagamento
      setShowQuickForm(false);
      setShowPaymentMethod(true);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    if (confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso aos recursos premium no final do ciclo de faturamento.')) {
      setIsCancelling(true);
      setCancelError('');
      try {
        await cancelAsaasSubscription({ subscriptionId: currentSubscription.id });
        loadUserData();
      } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        setCancelError('Ocorreu um erro ao cancelar. Tente novamente.');
      }
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-700" />
        <p className="ml-4 text-xl text-gray-800">Carregando informações...</p>
      </div>);

  }

  if (showQuickForm && selectedPlan && user) {
    const plan = plans.find((p) => p.key === selectedPlan.key);

    const getCurrentPricingQuickForm = () => {
      switch (selectedPlan.cycle) {
        case 'semiannual':return plan.semiannual;
        case 'annual':return plan.annual;
        default:return plan.monthly;
      }
    };
    const pricing = getCurrentPricingQuickForm();

    return (
      <div className="min-h-screen bg-gray-800 text-white p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                setShowQuickForm(false);
                setSelectedPlan(null);
              }}
              className="text-gray-300 mb-4 flex items-center mx-auto">

              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Planos
            </Button>
            <h1 className="text-2xl font-bold mb-2">Quase lá!</h1>
            <p className="text-gray-300 mb-4">
              Precisamos só de mais alguns dados para processar sua assinatura do plano <strong className="text-white">{plan.name}</strong>.
            </p>
          </div>

          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-6">
              <form onSubmit={handleQuickFormSubmit} className="space-y-4">
                {!user.cpf &&
                <div>
                    <Label htmlFor="cpf-input" className="text-white">CPF *</Label>
                    <Input
                    id="cpf-input"
                    type="text"
                    placeholder="000.000.000-00"
                    value={missingData.cpf}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    maxLength={14}
                    required
                    className={`bg-gray-600 border-gray-500 text-white placeholder-gray-400 mt-1 ${cpfError ? 'border-red-500' : ''}`} />

                    {cpfError &&
                  <p className="text-red-400 text-sm mt-1">{cpfError}</p>
                  }
                  </div>
                }
                
                {!user.phone &&
                <div>
                    <Label htmlFor="phone-input" className="text-white">Telefone *</Label>
                    <Input
                    id="phone-input"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={missingData.phone}
                    onChange={(e) => setMissingData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                    className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 mt-1" />

                  </div>
                }

                {(user.cpf || user.phone) && Object.keys(checkMissingData(user)).length === 0 &&
                <div className="text-center text-sm text-gray-400">
                        Seus dados de CPF e Telefone já estão completos.
                    </div>
                }

                <div className="pt-4 border-t border-gray-600 mt-6">
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold">
                      R$ {pricing.price} {selectedPlan.cycle === 'annual' ? '/ ano' : selectedPlan.cycle === 'semiannual' ? '/ semestre' : '/ mês'}
                    </div>
                    {pricing.savings &&
                    <div className="text-sm text-green-400">
                        Economize R$ {pricing.savings}
                      </div>
                    }
                    {selectedPlan.cycle === 'semiannual' && pricing.installments &&
                    <div className="text-sm text-yellow-300">
                        {pricing.installments}
                      </div>
                    }
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || Object.keys(checkMissingData(user)).length > 0 && (!missingData.cpf || !missingData.phone)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white">

                    {isSubmitting ?
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </> :

                    'Continuar para Pagamento'
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>);

  }

  // Tela de seleção de método de pagamento
  if (showPaymentMethod && selectedPlan && user) {
    const plan = plans.find((p) => p.key === selectedPlan.key);

    const getCurrentPricingPayment = () => {
      switch (selectedPlan.cycle) {
        case 'semiannual':return plan.semiannual;
        case 'annual':return plan.annual;
        default:return plan.monthly;
      }
    };
    const pricing = getCurrentPricingPayment();

    const paymentMethods = [
    {
      id: 'PIX',
      name: 'Pix',
      icon: QrCode,
      description: 'Pagamento instantâneo',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: 'CREDIT_CARD',
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Parcelamento disponível',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'BOLETO',
      name: 'Boleto Bancário',
      icon: FileText,
      description: 'Vencimento em 3 dias',
      color: 'from-orange-500 to-red-500'
    }];


    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setShowPaymentMethod(false);
              setSelectedPlan(null);
              setSelectedPaymentMethod('');
            }}
            className="mb-6 text-gray-700 hover:text-gray-900">

            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Planos
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8">

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Escolha a forma de pagamento
            </h1>
            <p className="text-gray-600">
              Assinatura do Plano <strong>{plan.name}</strong> - R$ {pricing.price} 
              {selectedPlan.cycle === 'annual' ? '/ano' : selectedPlan.cycle === 'semiannual' ? '/semestre' : '/mês'}
            </p>
            {pricing.savings &&
            <p className="text-green-600 font-semibold mt-1">
                Economize R$ {pricing.savings}!
              </p>
            }
          </motion.div>

          <div className="grid gap-4 mb-6">
            {paymentMethods.map((method, index) =>
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}>

                <Card
                className={`cursor-pointer transition-all duration-300 ${
                selectedPaymentMethod === method.id ?
                'ring-4 ring-blue-500 shadow-xl' :
                'hover:shadow-lg hover:scale-105'}`
                }
                onClick={() => setSelectedPaymentMethod(method.id)}>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${method.color} flex items-center justify-center flex-shrink-0`}>
                        <method.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{method.name}</h3>
                        <p className="text-gray-600">{method.description}</p>
                      </div>
                      {selectedPaymentMethod === method.id &&
                    <Check className="w-8 h-8 text-blue-600" />
                    }
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <Button
            onClick={() => processSubscription(selectedPlan.key, selectedPlan.cycle, selectedPaymentMethod)}
            disabled={!selectedPaymentMethod || isSubmitting}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6">

            {isSubmitting ?
            <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </> :

            'Continuar para Pagamento'
            }
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Você será redirecionado para uma página segura do Asaas para finalizar o pagamento
          </p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">


        {trialInfo && trialInfo.daysRemaining > 0 &&
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-[2px] shadow-2xl">
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-700">
                        Período de Teste Ativo!
                      </h3>
                      <span className="text-2xl">🎉</span>
                    </div>
                    <p className="text-amber-900 mb-4 text-base leading-relaxed">
                      Você tem <span className="font-bold text-orange-600 text-lg">{trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</span> de acesso gratuito 
                      a todas as funcionalidades do <span className="font-bold text-amber-800">Plano Avançado</span>!
                    </p>
                    <div className="relative w-full bg-amber-200/50 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                      <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(trialInfo.totalDays - trialInfo.daysRemaining) / trialInfo.totalDays * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-3 rounded-full shadow-md" />

                    </div>
                    <div className="flex items-start gap-2 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-amber-200">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 leading-relaxed mb-3">
                          <strong className="text-amber-900">Sua Aprovação Começa Aqui:</strong> O Melhor e Mais Organizado Site para Concursos Públicos.
                        </p>
                        <a 
                          href="https://www.instagram.com/conectadoemconcursos/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105">
                          📸 Siga nosso Instagram
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        }

        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900">

            Escolha um dos nossos planos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">

            Acelere sua aprovação com acesso total à nossa plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center mb-8">

            <div className="bg-gray-200 p-1 rounded-lg flex shadow-md">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md transition-all text-sm ${
                billingCycle === 'monthly' ?
                'bg-white text-gray-800 shadow-sm' :
                'text-gray-600 hover:text-gray-900'}`
                }>

                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('semiannual')}
                className={`px-4 py-2 rounded-md transition-all text-sm relative ${
                billingCycle === 'semiannual' ?
                'bg-white text-gray-800 shadow-sm' :
                'text-gray-600 hover:text-gray-900'}`
                }>

                Semestral
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Popular
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md transition-all text-sm relative ${
                billingCycle === 'annual' ?
                'bg-white text-gray-800 shadow-sm' :
                'text-gray-600 hover:text-gray-900'}`
                }>

                Anual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Economize
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-center justify-center">
          {plans.
          filter((plan) => !(plan.key === 'padrao' && billingCycle === 'annual')).
          map((plan) =>
          <PlanCard
            key={plan.name}
            plan={plan}
            currentPlan={currentSubscription}
            onSubscribe={handleSubscribe}
            isLoading={isSubmitting}
            loadingPlan={loadingPlan}
            onCancel={handleCancelSubscription}
            isCancelling={isCancelling}
            billingCycle={billingCycle}
            cancelError={cancelError}
            isInTrial={trialInfo && trialInfo.daysRemaining > 0} />

          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 text-center max-w-3xl mx-auto">

          <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 text-gray-800">
            <p className="text-lg">
              Escolha entre <strong>cobrança mensal</strong>, <strong>semestral com desconto</strong> ou <strong>anual com desconto maior</strong>.
              Você pode cancelar sua assinatura a qualquer momento e continuar usando até o final do período já pago.
            </p>
          </div>
        </motion.div>

        <FAQSection />

        <SocialLinks />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="mt-16 max-w-4xl mx-auto">

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-blue-600 text-slate-300 p-8 text-center from-indigo-600 via-purple-600 to-pink-600">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png"
                alt="Conectado em Concursos"
                className="w-20 h-20 mx-auto mb-6 object-contain"
              />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Quem Somos
              </h2>
            </div>
            <div className="p-8 md:p-12 text-gray-800">
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
    </div>);

}