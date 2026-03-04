import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { ActivityLog } from '@/entities/ActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shield, Ban, Clock, UserCheck, Eye, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { sanitizeUserData } from '@/components/security/dataValidator';

const roleLabels = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-800' },
  leitor: { label: 'Leitor', color: 'bg-gray-100 text-gray-800' }
};

const statusLabels = {
  active: { label: 'Ativo', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  banned: { label: 'Banido', icon: XCircle, color: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspenso', icon: Clock, color: 'bg-yellow-100 text-yellow-800' }
};

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [userActivities, setUserActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    role_type: 'leitor',
    status: 'active',
    suspended_until: '',
    ban_reason: '',
    current_plan: 'gratuito'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const userData = await User.list('-created_date');
      setUsers(userData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserActivities = async (userEmail) => {
    try {
      const activities = await ActivityLog.filter({ user_email: userEmail }, '-created_date', 100);
      setUserActivities(activities);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar histórico de atividades');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      role_type: user.role_type || 'leitor',
      status: user.status || 'active',
      suspended_until: user.suspended_until || '',
      ban_reason: user.ban_reason || '',
      current_plan: user.current_plan || 'gratuito'
    });
    setShowEditDialog(true);
  };

  const handleViewActivity = async (user) => {
    setSelectedUser(user);
    setShowActivityDialog(true);
    await loadUserActivities(user.email);
  };

  const handleSaveUser = async () => {
    try {
      // Sanitiza dados antes de salvar
      const sanitizedData = sanitizeUserData(editForm);
      await User.update(selectedUser.id, sanitizedData);

      toast.success('Usuário atualizado com sucesso!');
      setShowEditDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleBanUser = async (user) => {
    if (!window.confirm(`Tem certeza que deseja BANIR o usuário ${user.full_name}?`)) return;
    
    const reason = window.prompt('Motivo do banimento:');
    if (!reason) return;

    try {
      await User.update(user.id, {
        status: 'banned',
        ban_reason: reason
      });
      toast.success('Usuário banido com sucesso');
      loadUsers();
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      toast.error('Erro ao banir usuário');
    }
  };

  const handleSuspendUser = async (user) => {
    if (!window.confirm(`Tem certeza que deseja SUSPENDER o usuário ${user.full_name}?`)) return;
    
    const days = window.prompt('Por quantos dias? (ex: 7, 30)');
    if (!days) return;

    const reason = window.prompt('Motivo da suspensão:');
    if (!reason) return;

    try {
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(days));

      await User.update(user.id, {
        status: 'suspended',
        suspended_until: suspendedUntil.toISOString(),
        ban_reason: reason
      });
      toast.success(`Usuário suspenso por ${days} dias`);
      loadUsers();
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      toast.error('Erro ao suspender usuário');
    }
  };

  const handleReactivateUser = async (user) => {
    if (!window.confirm(`Reativar o usuário ${user.full_name}?`)) return;

    try {
      await User.update(user.id, {
        status: 'active',
        suspended_until: null,
        ban_reason: null
      });
      toast.success('Usuário reativado com sucesso');
      loadUsers();
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      toast.error('Erro ao reativar usuário');
    }
  };

  const handleToggleAdmin = async (user) => {
    const isCurrentlyAdmin = user.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    
    if (!window.confirm(`Tem certeza que deseja ${isCurrentlyAdmin ? 'REMOVER' : 'TORNAR'} ${user.full_name} como ADMIN?`)) return;

    try {
      const response = await base44.functions.invoke('updateUserRole', {
        email: user.email,
        role: newRole
      });

      if (response.success) {
        toast.success(response.message);
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar permissão de admin');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role_type === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const actionTypeLabels = {
    login: 'Login',
    logout: 'Logout',
    question_answered: 'Questão Respondida',
    simulation_started: 'Simulado Iniciado',
    simulation_completed: 'Simulado Concluído',
    material_uploaded: 'Material Enviado',
    material_viewed: 'Material Visualizado',
    comment_posted: 'Comentário Postado',
    profile_updated: 'Perfil Atualizado',
    subscription_created: 'Assinatura Criada',
    subscription_updated: 'Assinatura Atualizada',
    favorite_added: 'Favorito Adicionado',
    favorite_removed: 'Favorito Removido',
    flashcard_created: 'Flashcard Criado',
    flashcard_reviewed: 'Flashcard Revisado',
    schedule_created: 'Cronograma Criado',
    note_created: 'Nota Criada',
    article_viewed: 'Artigo Visualizado',
    video_watched: 'Vídeo Assistido',
    exam_viewed: 'Prova Visualizada'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Gerenciamento de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por permissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as permissões</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="leitor">Leitor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="suspended">Suspensos</SelectItem>
              <SelectItem value="banned">Banidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const StatusIcon = statusLabels[user.status || 'active'].icon;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleLabels[user.role_type || 'leitor'].color}>
                        {roleLabels[user.role_type || 'leitor'].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusLabels[user.status || 'active'].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusLabels[user.status || 'active'].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{user.current_plan || 'gratuito'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(user.created_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={user.role === 'admin' ? 'destructive' : 'default'}
                          onClick={() => handleToggleAdmin(user)}
                          title={user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                        >
                          {user.role === 'admin' ? <UserX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewActivity(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          Editar
                        </Button>
                        {user.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendUser(user)}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBanUser(user)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {(user.status === 'banned' || user.status === 'suspended') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateUser(user)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum usuário encontrado
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome: {selectedUser?.full_name}</Label>
              <p className="text-sm text-gray-500">{selectedUser?.email}</p>
            </div>
            
            <div>
              <Label>Nível de Permissão</Label>
              <Select 
                value={editForm.role_type} 
                onValueChange={(value) => setEditForm({...editForm, role_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="leitor">Leitor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Admin: acesso total | Editor: pode criar/editar conteúdo | Leitor: apenas visualização
              </p>
            </div>

            <div>
              <Label>Status da Conta</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(value) => setEditForm({...editForm, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="banned">Banido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Plano de Assinatura</Label>
              <Select 
                value={editForm.current_plan} 
                onValueChange={(value) => setEditForm({...editForm, current_plan: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Alterar o plano do usuário manualmente
              </p>
            </div>

            {editForm.status === 'suspended' && (
              <div>
                <Label>Suspenso Até</Label>
                <Input
                  type="datetime-local"
                  value={editForm.suspended_until?.slice(0, 16) || ''}
                  onChange={(e) => setEditForm({...editForm, suspended_until: e.target.value})}
                />
              </div>
            )}

            {(editForm.status === 'banned' || editForm.status === 'suspended') && (
              <div>
                <Label>Motivo</Label>
                <Textarea
                  value={editForm.ban_reason}
                  onChange={(e) => setEditForm({...editForm, ban_reason: e.target.value})}
                  placeholder="Descreva o motivo da suspensão/banimento"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Atividades */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Histórico de Atividades - {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-sm">
                      {format(new Date(activity.created_date), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {actionTypeLabels[activity.action_type] || activity.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{activity.description}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {activity.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {userActivities.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhuma atividade registrada
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}