import { useState, useEffect } from 'react';
import { Subscription } from '@/entities/Subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, User } from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const subscriptionsData = await Subscription.list('-created_date');
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      toast.error('Erro ao carregar assinaturas.');
    }
    setIsLoading(false);
  };

  const approveCancellation = async (subscription) => {
    try {
      await Subscription.update(subscription.id, {
        cancel_approved_date: new Date().toISOString()
      });
      
      toast.success('Solicitação de cancelamento confirmada. O usuário será notificado e o botão de assinar será liberado em 24h.');
      loadSubscriptions();
    } catch (error) {
      console.error('Erro ao confirmar cancelamento:', error);
      toast.error('Erro ao confirmar a solicitação.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'gratuito': return 'bg-gray-100 text-gray-800';
      case 'padrao': return 'bg-blue-100 text-blue-800';
      case 'avancado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanText = (plan) => {
    switch(plan) {
      case 'gratuito': return 'Gratuito';
      case 'padrao': return 'Padrão';
      case 'avancado': return 'Avançado';
      default: return plan;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Assinaturas dos Usuários</CardTitle>
          <Button onClick={loadSubscriptions} variant="outline" size="sm">
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Próximo Pagamento</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan="9" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="9" className="text-center py-8">
                    Nenhuma assinatura encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map(subscription => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{subscription.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(subscription.plan)}>
                        {getPlanText(subscription.plan)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(subscription.status)}>
                        {getStatusText(subscription.status)}
                      </Badge>
                      {subscription.cancel_requested && subscription.status !== 'cancelled' && (
                        <div className="flex flex-col gap-1 mt-1">
                          <Badge className="bg-orange-100 text-orange-800 w-max border-orange-200">
                            Solicitou Cancelamento
                          </Badge>
                          {!subscription.cancel_approved_date && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs mt-1 w-max border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              onClick={() => approveCancellation(subscription)}
                            >
                              Confirmar Solicitação
                            </Button>
                          )}
                          {subscription.cancel_approved_date && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs mt-1 w-max border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => cancelSubscriptionFinal(subscription)}
                            >
                              Finalizar (Cancelar)
                            </Button>
                          )}
                          {subscription.cancel_approved_date && (
                            <Badge className="bg-blue-100 text-blue-800 w-max border-blue-200 mt-1">
                              Cancelamento Aprovado
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscription.cycle === 'monthly' ? 'Mensal' : 'Anual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscription.price ? `R$ ${subscription.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {subscription.start_date ? format(new Date(subscription.start_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {subscription.end_date ? format(new Date(subscription.end_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {subscription.next_payment_date ? format(new Date(subscription.next_payment_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(subscription.created_date), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}