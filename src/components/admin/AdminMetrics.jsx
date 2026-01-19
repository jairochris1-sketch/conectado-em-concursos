import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Subscription } from '@/entities/Subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, TrendingUp, Activity } from 'lucide-react';

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    conversionRate: 0,
    planDistribution: { gratuito: 0, padrao: 0, avancado: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const users = await User.list(null, 1000);
        const subscriptions = await Subscription.list(null, 1000);

        const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
        const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
        
        const planDistribution = {
          gratuito: users.filter(u => u.current_plan === 'gratuito' || !u.current_plan).length,
          padrao: users.filter(u => u.current_plan === 'padrao').length,
          avancado: users.filter(u => u.current_plan === 'avancado').length
        };

        const conversionRate = users.length > 0 
          ? ((activeSubscriptions.length / users.length) * 100).toFixed(2)
          : 0;

        setMetrics({
          totalUsers: users.length,
          activeSubscriptions: activeSubscriptions.length,
          totalRevenue: totalRevenue.toFixed(2),
          conversionRate,
          planDistribution
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      }
      setLoading(false);
    };

    loadMetrics();
  }, []);

  const MetricCard = ({ icon: Icon, title, value, subtitle }) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-2">{title}</p>
            <p className="text-3xl font-bold text-white">{loading ? '-' : value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <Icon className="w-8 h-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          title="Total de Usuários"
          value={metrics.totalUsers}
          subtitle="Usuários cadastrados"
        />
        <MetricCard
          icon={CreditCard}
          title="Assinaturas Ativas"
          value={metrics.activeSubscriptions}
          subtitle="Clientes ativos"
        />
        <MetricCard
          icon={TrendingUp}
          title="Taxa de Conversão"
          value={`${metrics.conversionRate}%`}
          subtitle="% de usuários com assinatura"
        />
        <MetricCard
          icon={Activity}
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue}`}
          subtitle="De assinaturas ativas"
        />
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Distribuição de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.planDistribution).map(([plan, count]) => (
              <div key={plan}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{plan}</span>
                  <span className="text-sm text-gray-400">{count} usuários</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      plan === 'gratuito' ? 'bg-gray-500' :
                      plan === 'padrao' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                    style={{
                      width: `${metrics.totalUsers > 0 ? (count / metrics.totalUsers) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}