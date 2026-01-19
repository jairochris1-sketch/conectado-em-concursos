import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const userPayments = await base44.entities.PaymentHistory.filter(
        { user_email: userData.email },
        '-created_date'
      );
      setPayments(userPayments || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de pagamentos:', error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      RECEIVED: 'Recebido',
      CONFIRMED: 'Confirmado',
      PENDING: 'Pendente',
      OVERDUE: 'Vencido',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado'
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      BOLETO: 'Boleto',
      PIX: 'PIX',
      TRANSFER: 'Transferência',
      UNDEFINED: 'Indefinido'
    };
    return methods[method] || method;
  };

  const getCycleLabel = (cycle) => {
    const labels = {
      monthly: 'Mensal',
      semiannual: 'Semestral',
      annual: 'Anual'
    };
    return labels[cycle] || cycle;
  };

  const getPlanLabel = (plan) => {
    const labels = {
      padrao: 'Plano Padrão',
      avancado: 'Plano Avançado'
    };
    return labels[plan] || plan;
  };

  const filteredPayments = payments.filter(payment => 
    selectedStatus === 'all' || payment.status === selectedStatus
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Carregando histórico de pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Histórico de Pagamentos</h1>
              <p className="text-slate-300 mt-1">Acompanhe todos os seus pagamentos e faturas</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            Todos ({payments.length})
          </Button>
          {['RECEIVED', 'CONFIRMED', 'PENDING', 'OVERDUE'].map(status => {
            const count = payments.filter(p => p.status === status).length;
            return (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={selectedStatus === status ? 'bg-blue-600 text-white' : 'text-slate-300'}
              >
                {getStatusLabel(status)} ({count})
              </Button>
            );
          })}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">
                {selectedStatus === 'all' 
                  ? 'Nenhum pagamento registrado ainda' 
                  : `Nenhum pagamento com status "${getStatusLabel(selectedStatus)}"`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map(payment => (
              <Card key={payment.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {getPlanLabel(payment.plan)}
                            </h3>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            {getCycleLabel(payment.cycle)} • {getPaymentMethodLabel(payment.payment_method)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Valor</p>
                          <p className="font-semibold text-white">
                            R$ {payment.amount.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Vencimento</p>
                          <p className="font-semibold text-white">
                            {payment.due_date 
                              ? format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Data de Pagamento</p>
                          <p className="font-semibold text-white">
                            {payment.paid_date 
                              ? format(new Date(payment.paid_date), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">ID do Pagamento</p>
                          <p className="font-mono text-xs text-slate-300 truncate">
                            {payment.asaas_payment_id}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col gap-2 md:w-auto">
                      {payment.invoice_url && (
                        <a
                          href={payment.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Baixar Fatura</span>
                          <span className="sm:hidden">Fatura</span>
                        </a>
                      )}
                      <p className="text-xs text-slate-400 text-center">
                        {format(new Date(payment.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {payments.length > 0 && (
          <Card className="mt-8 bg-blue-900/20 border-blue-800 md:col-span-3">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Total de Pagamentos</p>
                  <p className="text-2xl font-bold text-white">{payments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Valor Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Pagamentos Recebidos</p>
                  <p className="text-2xl font-bold text-white">
                    {payments.filter(p => p.status === 'RECEIVED').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {payments.filter(p => p.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}