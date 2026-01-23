import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import moment from 'moment';

const statusConfig = {
    active: { label: 'Pago', icon: CheckCircle, style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    pending: { label: 'Pendente', icon: Clock, style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    inactive: { label: 'Inativo', icon: AlertCircle, style: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    cancelled: { label: 'Cancelado', icon: AlertCircle, style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    overdue: { label: 'Vencido', icon: AlertCircle, style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
};

const planLabels = {
    gratuito: 'Plano Gratuito',
    padrao: 'Plano Padrão',
    avancado: 'Plano Avançado'
};

const cycleLabels = {
    monthly: 'Mensal',
    semiannual: 'Semestral',
    annual: 'Anual'
};

export default function PaymentHistory() {
    const [user, setUser] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);

                const subs = await base44.entities.Subscription.filter({ 
                    user_email: userData.email 
                });

                // Ordenar por data de criação (mais recente primeiro)
                subs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                
                setSubscriptions(subs);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalPaid = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.price || 0), 0);

    const activeSub = subscriptions.find(s => s.status === 'active');
    const pendingSub = subscriptions.find(s => s.status === 'pending');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Histórico de Pagamentos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Acompanhe todas as suas transações e assinaturas
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {totalPaid.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                {subscriptions.filter(s => s.status === 'active').length} pagamento(s) confirmado(s)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {activeSub ? planLabels[activeSub.plan] : 'Gratuito'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {activeSub ? cycleLabels[activeSub.cycle] : 'Sem assinatura ativa'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximo Pagamento</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {activeSub?.next_payment_date ? 
                                    moment(activeSub.next_payment_date).format('DD/MM/YYYY') : 
                                    '-'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {activeSub?.next_payment_date ? 
                                    `${moment(activeSub.next_payment_date).fromNow()}` : 
                                    'Nenhum pagamento agendado'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Todas as Transações</CardTitle>
                        <CardDescription>
                            Histórico completo de pagamentos e assinaturas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Nenhuma transação encontrada
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Plano</TableHead>
                                            <TableHead>Ciclo</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions.map((sub) => {
                                            const StatusIcon = statusConfig[sub.status]?.icon || AlertCircle;
                                            return (
                                                <TableRow key={sub.id}>
                                                    <TableCell className="font-medium">
                                                        {moment(sub.created_date).format('DD/MM/YYYY HH:mm')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {planLabels[sub.plan] || sub.plan}
                                                    </TableCell>
                                                    <TableCell>
                                                        {cycleLabels[sub.cycle] || sub.cycle}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        R$ {(sub.price || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub.billing_type || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusConfig[sub.status]?.style}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig[sub.status]?.label || sub.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}