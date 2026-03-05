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
  annual: "Anual",
  manual: "Manual (Painel Admin)"
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
      
      try {
        const specialUsers = await base44.entities.SpecialUser.filter({ email: user.email, is_active: true });
        if (specialUsers.length > 0) {
          const su = specialUsers[0];
          // Adiciona o plano concedido pelo painel admin no topo da lista
          subs.unshift({
            id: su.id,
            status: 'active',
            plan: su.plan,
            start_date: su.created_date,
            end_date: su.valid_until,
            cycle: 'manual',
            is_special: true
          });
        }
      } catch (err) {
        console.error("Erro ao verificar acesso manual:", err);
      }

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
      // Registrar a solicitação no banco local (sem cancelar imediatamente)
      if (selectedSub.is_special) {
        await base44.entities.SpecialUser.update(selectedSub.id, {
          cancel_requested: true
        });
      } else {
        await Subscription.update(selectedSub.id, {
          cancel_requested: true
        });
      }

      // Enviar notificação para os administradores via banco de dados
      try {
        const user = await User.me();
        
        const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com', 'juniorgmj2016@gmail.com'];
        for (const email of adminEmails) {
          await base44.entities.Notification.create({
            user_email: email,
            title: "🚨 Solicitação de Cancelamento",
            message: `O usuário ${user.full_name} (${user.email}) solicitou o cancelamento da assinatura do plano ${planNames[selectedSub.plan] || selectedSub.plan}. Verifique a aba de Assinaturas.`,
            type: "warning",
            related_user_name: user.full_name,
            related_user_photo: user.profile_photo_url,
            action_url: "/Admin"
          });
        }
      } catch (notifError) {
        console.error("Erro ao enviar notificação aos admins:", notifError);
      }

      // Atualizar estado local
      setSubscriptions(prev => prev.map(s => 
        s.id === selectedSub.id 
          ? { ...s, cancel_requested: true } 
          : s
      ));

      toast.success("Solicitação de cancelamento enviada com sucesso! Os administradores foram notificados.");
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
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-4 shadow-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 hidden sm:block" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">
              Plano Ativo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm opacity-90">
              <div>
                <span className="font-semibold">Tipo de plano:</span> {planNames[activeSub.plan] || activeSub.plan}
              </div>
              <div>
                <span className="font-semibold">Início:</span> {formatDateTime(activeSub.start_date || activeSub.created_date)}
              </div>
              {!(activeSub.cycle === 'manual' || activeSub.is_special) && (
                <div>
                  <span className="font-semibold">Fim:</span> {activeSub.end_date ? formatDateTime(activeSub.end_date) : (activeSub.next_payment_date ? formatDateTime(activeSub.next_payment_date) : "Vitalício / Sem data")}
                </div>
              )}
            </div>
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

            // Verificar se passaram 24h desde a aprovação do cancelamento
            const hasPassed24hSinceApproval = sub.cancel_approved_date && 
              (new Date().getTime() - new Date(sub.cancel_approved_date).getTime() > 24 * 60 * 60 * 1000);

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
                      {sub.cycle !== 'manual' && (
                        <CardDescription className="mt-1">
                          Ciclo {cycleNames[sub.cycle] || sub.cycle} • {formatCurrency(sub.price)}
                        </CardDescription>
                      )}
                    </div>
                    
                    {sub.cancel_requested && !sub.cancel_approved_date ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled
                        className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 opacity-100"
                      >
                        Enviado solicitação de cancelamento
                      </Button>
                    ) : sub.cancel_approved_date && !hasPassed24hSinceApproval ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled
                        className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 opacity-100"
                      >
                        Solicitação Aceita (Aguarde 24h)
                      </Button>
                    ) : sub.cancel_approved_date && hasPassed24hSinceApproval ? (
                      <Link to={createPageUrl("Subscription")}>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Assinar Novamente
                        </Button>
                      </Link>
                    ) : isCancelable && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleCancelRequest(sub)}
                        disabled={cancelingId === sub.id}
                      >
                        {cancelingId === sub.id ? (
                          <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processando...</>
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
            <DialogDescription className="pt-3 text-base text-gray-700 dark:text-gray-300">
              Tem certeza que deseja cancelar sua assinatura do <strong>{selectedSub ? planNames[selectedSub.plan] || selectedSub.plan : ''}</strong> para estudos para Concursos Públicos no conectadoemconcursos?
              <br /><br />
              Uma mensagem será enviada para o painel do administrador e a assinatura será cancelada.
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