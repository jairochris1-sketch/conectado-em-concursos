import { useState, useEffect } from 'react';
import { Subscription } from '@/entities/Subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, filterStatus]);

  const loadSubscriptions = async () => {
    try {
      const allSubscriptions = await Subscription.list('-created_date', 500);
      setSubscriptions(allSubscriptions);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      toast.error('Erro ao carregar assinaturas');
    }
    setLoading(false);
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    filtered = filtered.filter(s =>
      s.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredSubscriptions(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-900 text-green-200',
      pending: 'bg-yellow-900 text-yellow-200',
      cancelled: 'bg-red-900 text-red-200',
      overdue: 'bg-orange-900 text-orange-200'
    };
    return colors[status] || 'bg-gray-900 text-gray-200';
  };

  const getPlanColor = (plan) => {
    const colors = {
      gratuito: 'bg-gray-700 text-gray-200',
      padrao: 'bg-blue-700 text-blue-200',
      avancado: 'bg-purple-700 text-purple-200'
    };
    return colors[plan] || 'bg-gray-700 text-gray-200';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando assinaturas...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Gerenciador de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredSubscriptions.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-white">{sub.user_email}</p>
                    <Badge className={getPlanColor(sub.plan)}>
                      {sub.plan}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Próximo: {sub.next_payment_date ? new Date(sub.next_payment_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      R$ {sub.price?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <Badge className={getStatusColor(sub.status)}>
                    {sub.status}
                  </Badge>
                  {sub.cycle && (
                    <span className="text-xs text-gray-400">
                      {sub.cycle === 'monthly' ? 'Mensal' : sub.cycle === 'annual' ? 'Anual' : 'Semestral'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Total: {filteredSubscriptions.length} assinaturas
          </div>
        </CardContent>
      </Card>
    </div>
  );
}