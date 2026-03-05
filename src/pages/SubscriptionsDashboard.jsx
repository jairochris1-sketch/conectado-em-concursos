import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const statusConfig = {
  active: { label: "Ativa", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  overdue: { label: "Atrasada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  inactive: { label: "Inativa", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: XCircle }
};

const planNames = {
  gratuito: "Plano Gratuito",
  padrao: "Plano Padrão",
  avancado: "Plano Premium"
};

const cycleNames = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual"
};

export default function SubscriptionsDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      if (!user) return;

      const subs = await Subscription.filter({ user_email: user.email }, '-created_date');
      setSubscriptions(subs);
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error);
      toast.error("Não foi possível carregar suas assinaturas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (sub) => {
    setSelectedSub(sub);
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedSub) return;
    
    setCancelingId(selectedSub.id);
    setIsCancelModalOpen(false);

    try {
      if (selectedSub.asaas_subscription_id) {
        // Cancelar no Asaas se tiver ID da assinatura
        const response = await base44.functions.invoke('cancelAsaasSubscription', {
          subscriptionId: selectedSub.asaas_subscription_id
        });

        if (response.data?.error) {
          throw new Error(response.data.error);
        }
      }

      // Atualizar no banco local
      await Subscription.update(selectedSub.id, {
        status: 'cancelled',
        end_date: new Date().toISOString().split('T')[0]
      });

      // Atualizar estado local
      setSubscriptions(prev => prev.map(s => 
        s.id === selectedSub.id 
          ? { ...s, status: 'cancelled', end_date: new Date().toISOString().split('T')[0] } 
          : s
      ));

      toast.success("Assinatura cancelada com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error(error.message || "Erro ao cancelar assinatura. Tente novamente mais tarde.");
    } finally {
      setCancelingId(null);
      setSelectedSub(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto flex justify-center items-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeSub = subscriptions.find(s => s.status === 'active');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Painel de Assinaturas
          </h1>
          <p className="text-gray-500 mt-1">Gerencie seus planos e histórico de pagamentos.</p>
        </div>
        
        <Link to={createPageUrl("Subscription")}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Ver Planos Disponíveis
          </Button>
        </Link>
      </div>

      {activeSub && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3 shadow-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-bold text-lg">
              {planNames[activeSub.plan] || activeSub.plan} Ativo
            </h3>
            <p className="text-sm opacity-90">
              Ativado em: {formatDateTime(activeSub.start_date || activeSub.created_date)}
            </p>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma assinatura encontrada</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Você ainda não possui nenhum histórico de assinaturas em nossa plataforma.
            </p>
            <Link to={createPageUrl("Subscription")}>
              <Button>Conhecer Planos</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((sub) => {
            const statusInfo = statusConfig[sub.status] || statusConfig.inactive;
            const StatusIcon = statusInfo.icon;
            const isCancelable = sub.status === 'active' || sub.status === 'pending' || sub.status === 'overdue';

            return (
              <Card key={sub.id} className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: sub.status === 'active' ? '#10b981' : sub.status === 'pending' ? '#f59e0b' : sub.status === 'overdue' ? '#ef4444' : '#9ca3af' }}>
                <CardHeader className="pb-3 bg-gray-50/50 dark:bg-gray-800/20 border-b">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {planNames[sub.plan] || sub.plan}
                        <Badge className={`${statusInfo.color} border-0 flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Ciclo {cycleNames[sub.cycle] || sub.cycle} • {formatCurrency(sub.price)}
                      </CardDescription>
                    </div>
                    
                    {isCancelable && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleCancelRequest(sub)}
                        disabled={cancelingId === sub.id}
                      >
                        {cancelingId === sub.id ? (
                          <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Cancelando...</>
                        ) : (
                          "Cancelar Assinatura"
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Início</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(sub.start_date || sub.created_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                          {sub.status === 'cancelled' || sub.status === 'inactive' ? 'Fim' : 'Próxima Cobrança'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(sub.status === 'cancelled' || sub.status === 'inactive' ? sub.end_date : sub.next_payment_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-gray-600 dark:text-gray-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="w-full">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Método / Fatura</p>
                        {sub.payment_url ? (
                          <a 
                            href={sub.payment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center group"
                          >
                            Ver fatura Asaas
                            <ChevronRight className="w-3 h-3 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {sub.billing_type || "Não definido"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirmar Cancelamento
            </DialogTitle>
            <DialogDescription className="pt-3 text-base">
              Tem certeza que deseja cancelar sua assinatura do <strong>{selectedSub ? planNames[selectedSub.plan] || selectedSub.plan : ''}</strong>?
              <br /><br />
              Seu acesso aos recursos premium será revogado imediatamente e você não será mais cobrado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Sim, Cancelar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}