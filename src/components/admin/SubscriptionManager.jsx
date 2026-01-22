import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2, Trash2, Eye, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [specialUsers, setSpecialUsers] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, special, allUsers] = await Promise.all([
        base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
        base44.asServiceRole.entities.SpecialUser.list('-created_date', 1000),
        base44.asServiceRole.entities.User.list('-created_date', 1000)
      ]);

      setSubscriptions(subs);
      setSpecialUsers(special);

      const userMap = {};
      allUsers.forEach(user => {
        userMap[user.email] = user;
      });
      setUsers(userMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPlanColor = (plan) => {
    const colors = {
      gratuito: 'bg-gray-100 text-gray-800',
      padrao: 'bg-blue-100 text-blue-800',
      avancado: 'bg-yellow-100 text-yellow-800'
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const handleEditPlan = async (subscription) => {
    setSelectedSubscription(subscription);
    setEditData({
      plan: subscription.plan,
      status: subscription.status,
      notes: subscription.notes || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const user = await base44.auth.me();
      
      await base44.asServiceRole.entities.Subscription.update(
        selectedSubscription.id,
        editData
      );

      // Log de auditoria
      await base44.asServiceRole.entities.AuditLog.create({
        admin_email: user.email,
        admin_name: user.full_name,
        action_type: 'subscription_updated',
        entity_type: 'Subscription',
        entity_id: selectedSubscription.id,
        entity_description: `${selectedSubscription.user_email} - ${editData.plan}`,
        changes: {
          before: {
            plan: selectedSubscription.plan,
            status: selectedSubscription.status,
            notes: selectedSubscription.notes
          },
          after: editData
        }
      });

      toast.success('Assinatura atualizada com sucesso');
      setShowEditDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar assinatura');
    }
  };

  const handleToggleStatus = async (subscription) => {
    try {
      const user = await base44.auth.me();
      const newStatus = subscription.status === 'active' ? 'cancelled' : 'active';
      
      await base44.asServiceRole.entities.Subscription.update(
        subscription.id,
        { status: newStatus }
      );

      // Log de auditoria
      await base44.asServiceRole.entities.AuditLog.create({
        admin_email: user.email,
        admin_name: user.full_name,
        action_type: 'subscription_updated',
        entity_type: 'Subscription',
        entity_id: subscription.id,
        entity_description: `${subscription.user_email} - Status alterado`,
        changes: {
          status: { from: subscription.status, to: newStatus }
        }
      });

      toast.success(`Assinatura ${newStatus === 'active' ? 'ativada' : 'desativada'}`);
      loadData();
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDeleteSubscription = async (subscription) => {
    if (window.confirm('Tem certeza que deseja deletar esta assinatura?')) {
      try {
        const user = await base44.auth.me();
        
        await base44.asServiceRole.entities.Subscription.delete(subscription.id);

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
          admin_email: user.email,
          admin_name: user.full_name,
          action_type: 'subscription_deleted',
          entity_type: 'Subscription',
          entity_id: subscription.id,
          entity_description: `${subscription.user_email} - ${subscription.plan}`,
          notes: 'Assinatura deletada pelo administrador'
        });

        toast.success('Assinatura deletada');
        loadData();
      } catch (error) {
        console.error('Erro ao deletar:', error);
        toast.error('Erro ao deletar assinatura');
      }
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    users[sub.user_email]?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Gerenciador de Assinaturas</h2>
        <p className="text-gray-600 mb-6">Gerencie assinaturas de usuários, planos e status de pagamento</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Assinaturas Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {subscriptions.filter(s => s.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {specialUsers.filter(s => s.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Usuários Especiais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {Object.keys(users).length}
              </p>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma assinatura encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">Plano</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Início</th>
                    <th className="text-left py-3 px-4 font-semibold">Vencimento</th>
                    <th className="text-left py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => {
                    const user = users[sub.user_email];
                    const expiryDate = sub.expiry_date ? new Date(sub.expiry_date) : null;
                    const isExpired = expiryDate && expiryDate < new Date();

                    return (
                      <tr key={sub.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{sub.user_email}</td>
                        <td className="py-3 px-4">{user?.full_name || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge className={getPlanColor(sub.plan)}>
                            {sub.plan}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(isExpired ? 'expired' : sub.status)}>
                            {isExpired ? 'Expirado' : sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {sub.start_date ? format(new Date(sub.start_date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {expiryDate ? format(expiryDate, 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Dialog open={showDetailsDialog && selectedSubscription?.id === sub.id} onOpenChange={setShowDetailsDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedSubscription(sub)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalhes da Assinatura</DialogTitle>
                                </DialogHeader>
                                {selectedSubscription && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-semibold">{selectedSubscription.user_email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Nome</p>
                                        <p className="font-semibold">{users[selectedSubscription.user_email]?.full_name || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Plano</p>
                                        <p className="font-semibold">{selectedSubscription.plan}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <Badge className={getStatusColor(selectedSubscription.status)}>
                                          {selectedSubscription.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Período</p>
                                        <p className="font-semibold">{selectedSubscription.billing_period || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Valor</p>
                                        <p className="font-semibold">R$ {selectedSubscription.amount || '0.00'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">ID Externo</p>
                                        <p className="font-mono text-xs">{selectedSubscription.external_subscription_id || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Método de Pagamento</p>
                                        <p className="font-semibold">{selectedSubscription.payment_method || '-'}</p>
                                      </div>
                                    </div>
                                    {selectedSubscription.notes && (
                                      <div>
                                        <p className="text-sm text-gray-600">Notas</p>
                                        <p className="text-sm bg-gray-50 p-3 rounded">{selectedSubscription.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog open={showEditDialog && selectedSubscription?.id === sub.id} onOpenChange={setShowEditDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPlan(sub)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Assinatura</DialogTitle>
                                </DialogHeader>
                                {editData && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Plano</label>
                                      <Select value={editData.plan} onValueChange={(value) => setEditData({ ...editData, plan: value })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="gratuito">Gratuito</SelectItem>
                                          <SelectItem value="padrao">Padrão</SelectItem>
                                          <SelectItem value="avancado">Avançado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Ativo</SelectItem>
                                          <SelectItem value="pending">Pendente</SelectItem>
                                          <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Notas</label>
                                      <Textarea
                                        value={editData.notes}
                                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                        placeholder="Notas adicionais..."
                                      />
                                    </div>
                                    <Button onClick={handleSaveEdit} className="w-full">
                                      Salvar Alterações
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(sub)}
                              className={sub.status === 'active' ? 'text-red-600' : 'text-green-600'}
                            >
                              <Power className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSubscription(sub)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Especiais</CardTitle>
        </CardHeader>
        <CardContent>
          {specialUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum usuário especial</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Plano</th>
                    <th className="text-left py-3 px-4 font-semibold">Motivo</th>
                    <th className="text-left py-3 px-4 font-semibold">Válido Até</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {specialUsers.map((special) => {
                    const isExpired = special.valid_until && new Date(special.valid_until) < new Date();
                    return (
                      <tr key={special.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{special.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={getPlanColor(special.plan)}>
                            {special.plan}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs">{special.reason || '-'}</td>
                        <td className="py-3 px-4 text-xs">
                          {special.valid_until ? format(new Date(special.valid_until), 'dd/MM/yyyy') : 'Ilimitado'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={special.is_active && !isExpired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {special.is_active && !isExpired ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}