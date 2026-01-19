import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, X, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const planPrices = {
  padrao: {
    monthly: 39.90,
    semiannual: 119.70,
    annual: 239.40
  },
  avancado: {
    monthly: 80.90,
    semiannual: 242.70,
    annual: 485.40
  }
};

const basePlans = [
  {
    id: "gratuito",
    name: "Acesso Básico",
    description: "Comece seus estudos gratuitamente",
    features: [
      "10 questões por dia",
      "Anotações pessoais"
    ],
    excluded: [
      "Acesso ao gabarito comentado"
    ],
    color: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-900 dark:text-white"
  },
  {
    id: "padrao",
    name: "⭐ Plano Padrão",
    description: "Para quem quer estudar sério",
    features: [
      "Questões ilimitadas",
      "Acesso ao gabarito comentado",
      "Resumos",
      "Lousa digital",
      "Estatísticas de desempenho"
    ],
    excluded: [],
    color: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-900 dark:text-blue-100",
    highlight: true
  },
  {
    id: "avancado",
    name: "🚀 Plano Avançado",
    description: "Máximo de recursos e suporte",
    features: [
      "Questões ilimitadas",
      "Ranking de usuários",
      "Provas completas",
      "Cronômetro de Estudos",
      "Resumos",
      "Fórum de dúvidas",
      "Relatórios de desempenho",
      "Área de estudos personalizada"
    ],
    excluded: [],
    color: "bg-yellow-50 dark:bg-yellow-900/20",
    textColor: "text-yellow-900 dark:text-yellow-100",
    highlight: true
  }
];

const getCycleLabel = (cycle) => {
  switch(cycle) {
    case 'semiannual': return '6 meses';
    case 'annual': return 'ao ano';
    default: return 'mês';
  }
};

const getPlanPrice = (planId, cycle) => {
  if (planId === 'gratuito') return 'R$ 0';
  const price = planPrices[planId][cycle];
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState("monthly");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const userSubscriptions = await Subscription.filter({
        user_email: userData.email,
        status: "active"
      });

      if (userSubscriptions.length > 0) {
        setCurrentSubscription(userSubscriptions[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    console.log("=== INICIANDO PROCESSO DE ASSINATURA ===");
    console.log("Plano selecionado:", planId);
    console.log("Ciclo selecionado:", selectedCycle);
    console.log("Usuário:", user);
    
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (planId === "gratuito") {
      toast.info("Plano Gratuito - Sem necessidade de pagamento");
      return;
    }

    setProcessingPlan(planId);
    try {
      console.log("Chamando função createAsaasSubscription...");
      const response = await base44.functions.invoke("createAsaasSubscription", {
        plan: planId,
        cycle: selectedCycle
      });

      console.log("Resposta recebida:", response);
      console.log("response.data:", response.data);

      if (response.data?.success) {
        console.log("Sucesso! payment_link:", response.data?.payment_link);
        toast.success("Assinatura criada! Redirecionando...");
        setTimeout(() => {
          if (response.data?.payment_link) {
            console.log("Redirecionando para:", response.data.payment_link);
            window.location.href = response.data.payment_link;
          } else {
            console.log("Sem payment_link, recarregando dados do usuário");
            loadUserData();
          }
        }, 2000);
      } else {
        console.error("Falha na criação:", response.data);
        toast.error(response.data?.message || "Erro ao criar assinatura");
      }
    } catch (error) {
      console.error("=== ERRO NO PROCESSO ===");
      console.error("Tipo:", error.constructor.name);
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
      console.error("Error completo:", error);
      toast.error("Erro ao processar sua assinatura");
    } finally {
      console.log("=== FINALIZANDO PROCESSO ===");
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    if (!window.confirm("Tem certeza que deseja cancelar sua assinatura?")) {
      return;
    }

    try {
      await base44.functions.invoke("cancelAsaasSubscription", {
        subscription_id: currentSubscription.id
      });

      toast.success("Assinatura cancelada");
      loadUserData();
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error("Erro ao cancelar assinatura");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const currentPlan = basePlans.find(p => p.id === (user?.current_plan || "gratuito"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-slate-300">
            Desbloqueie todo o poder do Conectado em Concursos Públicos SE
          </p>
          
          {/* Cycle Toggle */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setSelectedCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedCycle('semiannual')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedCycle === 'semiannual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Semestral
            </button>
            <button
              onClick={() => setSelectedCycle('annual')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Current Plan Alert */}
        {currentSubscription && (
          <Alert className="mb-8 bg-green-900/20 border-green-800">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <AlertDescription className="text-green-300 ml-3">
              Você está usando o <strong>{currentPlan?.name}</strong>. 
              Próximo pagamento: {new Date(currentSubscription.next_payment_date).toLocaleDateString("pt-BR")}
            </AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {basePlans.map((plan) => {
            const isCurrentPlan = user?.current_plan === plan.id;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all duration-300 ${
                  plan.highlight
                    ? "border-blue-500 shadow-2xl md:scale-105"
                    : "border-slate-700"
                } ${plan.color}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">POPULAR</Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-6">
                    <Badge className="bg-green-600 text-white">PLANO ATUAL</Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className={plan.textColor}>{plan.name}</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${plan.textColor}`}>
                        {plan.id === 'gratuito' ? 'R$ 0' : getPlanPrice(plan.id, selectedCycle)}
                      </span>
                      {plan.id !== 'gratuito' && (
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          /{getCycleLabel(selectedCycle)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}

                    {plan.excluded.map((feature, idx) => (
                      <div key={`excluded-${idx}`} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-500 dark:text-slate-500 text-sm line-through">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-green-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isProcessing}
                      className={`w-full ${
                        plan.highlight
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-slate-700 hover:bg-slate-600"
                      } text-white`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {plan.id === "gratuito" ? "Usar Plano Gratuito" : "Contratar Agora"}
                        </>
                      )}
                    </Button>
                  )}

                  {isCurrentPlan && currentSubscription && (
                    <Button
                      onClick={handleCancelSubscription}
                      variant="outline"
                      className="w-full mt-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Cancelar Assinatura
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-white mb-2">
                  Posso mudar de plano depois?
                </h4>
                <p className="text-slate-300 text-sm">
                  Sim! Você pode atualizar ou fazer downgrade de seu plano a qualquer momento.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">
                  Há período de teste?
                </h4>
                <p className="text-slate-300 text-sm">
                  Sim! Usuários novos do plano gratuito têm 10 dias de acesso ao plano avançado como teste.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">
                  Como faço para cancelar?
                </h4>
                <p className="text-slate-300 text-sm">
                  Você pode cancelar sua assinatura a qualquer momento na página de perfil ou aqui mesmo clicando em "Cancelar Assinatura".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}