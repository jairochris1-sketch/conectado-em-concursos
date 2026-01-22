import React, { useState, useEffect } from 'react';
import { Subscription } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, DollarSign, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors = {
  active: '#10b981',
  inactive: '#6b7280',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  overdue: '#dc2626'
};

const planColors = {
  gratuito: '#3b82f6',
  padrao: '#8b5cf6',
  avancado: '#f59e0b'
};

const planNames = {
  gratuito: 'Gratuito',
  padrao: 'Padrão',
  avancado: 'Avançado'
};

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await Subscription.list('-created_date', 1000);
      setSubscriptions(data);
      applyFilters(data, selectedPlan, selectedCycle, selectedStatus);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data, plan, cycle, status) => {
    let filtered = [...data];

    if (plan !== 'all') {
      filtered = filtered.filter(s => s.plan === plan);
    }
    if (cycle !== 'all') {
      filtered = filtered.filter(s => s.cycle === cycle);
    }
    if (status !== 'all') {
      filtered = filtered.filter(s => s.status === status);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'plan') {
      setSelectedPlan(value);
      applyFilters(subscriptions, value, selectedCycle, selectedStatus);
    } else if (filterType === 'cycle') {
      setSelectedCycle(value);
      applyFilters(subscriptions, selectedPlan, value, selectedStatus);
    } else if (filterType === 'status') {
      setSelectedStatus(value);
      applyFilters(subscriptions, selectedPlan, selectedCycle, value);
    }
  };

  // Calcular métricas
  const metrics = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    inactive: subscriptions.filter(s => s.status === 'inactive').length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    overdue: subscriptions.filter(s => s.status === 'overdue').length,
  };

  // Calcular MRR (Monthly Recurring Revenue)
  const calculateMRR = () => {
    return subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        let monthlyValue = s.price || 0;
        
        if (s.cycle === 'semiannual') {
          monthlyValue = (s.price || 0) / 6;
        } else if (s.cycle === 'annual') {
          monthlyValue = (s.price || 0) / 12;
        }
        
        return sum + monthlyValue;
      }, 0);
  };

  // Dados por plano
  const planData = [
    {
      name: 'Gratuito',
      value: subscriptions.filter(s => s.plan === 'gratuito').length,
      fill: planColors.gratuito
    },
    {
      name: 'Padrão',
      value: subscriptions.filter(s => s.plan === 'padrao').length,
      fill: planColors.padrao
    },
    {
      name: 'Avançado',
      value: subscriptions.filter(s => s.plan === 'avancado').length,
      fill: planColors.avancado
    }
  ];

  // Dados por status
  const statusData = [
    { name: 'Ativa', value: metrics.active, fill: statusColors.active },
    { name: 'Inativa', value: metrics.inactive, fill: statusColors.inactive },
    { name: 'Pendente', value: metrics.pending, fill: statusColors.pending },
    { name: 'Cancelada', value: metrics.cancelled, fill: statusColors.cancelled },
    { name: 'Vencida', value: metrics.overdue, fill: statusColors.overdue }
  ].filter(s => s.value > 0);

  // Dados de receita por plano
  const revenueByPlan = [
    {
      name: 'Gratuito',
      monthly: subscriptions.filter(s => s.plan === 'gratuito' && s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0),
      annual: subscriptions.filter(s => s.plan === 'gratuito' && s.status === 'active').reduce((sum, s) => sum + (s.price || 0) * 12, 0)
    },
    {
      name: 'Padrão',
      monthly: subscriptions
        .filter(s => s.plan === 'padrao' && s.status === 'active')
        .reduce((sum, s) => {
          const price = s.price || 0;
          if (s.cycle === 'semiannual') return sum + price / 6;
          if (s.cycle === 'annual') return sum + price / 12;
          return sum + price;
        }, 0),
      annual: subscriptions
        .filter(s => s.plan === 'padrao' && s.status === 'active')
        .reduce((sum, s) => {
          const price = s.price || 0;
          if (s.cycle === 'semiannual') return sum + (price / 6) * 12;
          if (s.cycle === 'annual') return sum + price;
          return sum + price * 12;
        }, 0)
    },
    {
      name: 'Avançado',
      monthly: subscriptions
        .filter(s => s.plan === 'avancado' && s.status === 'active')
        .reduce((sum, s) => {
          const price = s.price || 0;
          if (s.cycle === 'semiannual') return sum + price / 6;
          if (s.cycle === 'annual') return sum + price / 12;
          return sum + price;
        }, 0),
      annual: subscriptions
        .filter(s => s.plan === 'avancado' && s.status === 'active')
        .reduce((sum, s) => {
          const price = s.price || 0;
          if (s.cycle === 'semiannual') return sum + (price / 6) * 12;
          if (s.cycle === 'annual') return sum + price;
          return sum + price * 12;
        }, 0)
    }
  ];

  const mrr = calculateMRR();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Plano</label>
              <Select value={selectedPlan} onValueChange={(value) => handleFilterChange('plan', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Ciclo</label>
              <Select value={selectedCycle} onValueChange={(value) => handleFilterChange('cycle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ciclos</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total de Assinantes</p>
                  <p className="text-3xl font-bold">{metrics.total}</p>
                </div>
                <Users className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold">{metrics.active}</p>
                </div>
                <CheckCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Assinaturas Inativas</p>
                  <p className="text-3xl font-bold">{metrics.inactive}</p>
                </div>
                <XCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Vencidas</p>
                  <p className="text-3xl font-bold">{metrics.overdue}</p>
                </div>
                <AlertCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">MRR (Mensal)</p>
                  <p className="text-3xl font-bold">R$ {mrr.toFixed(0)}</p>
                </div>
                <DollarSign className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita por Plano */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita Estimada por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="monthly" fill="#3b82f6" name="Receita Mensal Estimada" />
                <Bar dataKey="annual" fill="#8b5cf6" name="Receita Anual Estimada" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Assinaturas Filtradas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Filtradas ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Plano</th>
                  <th className="text-left py-3 px-4 font-semibold">Ciclo</th>
                  <th className="text-left py-3 px-4 font-semibold">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Próximo Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.slice(0, 10).map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{sub.user_email}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-100 text-blue-800">
                        {planNames[sub.plan] || sub.plan}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {sub.cycle === 'monthly' ? 'Mensal' : sub.cycle === 'semiannual' ? 'Semestral' : 'Anual'}
                    </td>
                    <td className="py-3 px-4 font-medium">R$ {(sub.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge style={{ backgroundColor: statusColors[sub.status], color: '#fff' }}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {sub.next_payment_date ? new Date(sub.next_payment_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubscriptions.length > 10 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Mostrando 10 de {filteredSubscriptions.length} assinaturas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}