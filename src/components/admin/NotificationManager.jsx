import React, { useState, useEffect } from 'react';
import { Notification } from '@/entities/Notification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Bell, Loader2, X } from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';

const notificationTypes = [
  { value: 'info', label: 'Informação', color: 'bg-blue-100 text-blue-800' },
  { value: 'success', label: 'Sucesso', color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: 'Aviso', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'error', label: 'Erro', color: 'bg-red-100 text-red-800' },
  { value: 'new_material', label: 'Novo Material', color: 'bg-purple-100 text-purple-800' }
];

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    is_global: true,
    target_users: '',
    action_url: '',
    expires_at: ''
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const notificationsData = await Notification.list('-created_date');
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Título e mensagem são obrigatórios.');
      return;
    }

    try {
      const notificationData = {
        ...formData,
        target_users: formData.is_global ? [] : formData.target_users.split(',').map(email => email.trim()).filter(Boolean),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      if (editingNotification) {
        await Notification.update(editingNotification.id, notificationData);
        toast.success('Notificação atualizada com sucesso!');
      } else {
        await Notification.create(notificationData);
        toast.success('Notificação criada com sucesso!');
      }

      handleCancel();
      loadNotifications();
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      toast.error('Erro ao salvar notificação.');
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_global: notification.is_global,
      target_users: Array.isArray(notification.target_users) ? notification.target_users.join(', ') : '',
      action_url: notification.action_url || '',
      expires_at: notification.expires_at ? new Date(notification.expires_at).toISOString().slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await Notification.delete(id);
        toast.success('Notificação excluída com sucesso!');
        loadNotifications();
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        toast.error('Erro ao excluir notificação.');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      is_global: true,
      target_users: '',
      action_url: '',
      expires_at: ''
    });
  };

  const getTypeColor = (type) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Gerenciar Notificações
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Notificação
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingNotification ? 'Editar Notificação' : 'Nova Notificação'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título da notificação"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Mensagem da notificação"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="action_url">URL de Ação (opcional)</Label>
                  <Input
                    id="action_url"
                    value={formData.action_url}
                    onChange={(e) => setFormData({...formData, action_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_global"
                    checked={formData.is_global}
                    onCheckedChange={(checked) => setFormData({...formData, is_global: checked})}
                  />
                  <Label htmlFor="is_global">Notificação Global (para todos os usuários)</Label>
                </div>

                {!formData.is_global && (
                  <div>
                    <Label htmlFor="target_users">E-mails dos Usuários (separados por vírgula)</Label>
                    <Input
                      id="target_users"
                      value={formData.target_users}
                      onChange={(e) => setFormData({...formData, target_users: e.target.value})}
                      placeholder="user1@email.com, user2@email.com"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingNotification ? 'Atualizar' : 'Criar'} Notificação
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alcance</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="6" className="text-center py-8">
                        Nenhuma notificação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map(notification => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{notification.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(notification.type)}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.is_global ? 'default' : 'secondary'}>
                            {notification.is_global ? 'Global' : 'Específicos'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(new Date(notification.created_date), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {notification.expires_at ? 
                            format(new Date(notification.expires_at), 'dd/MM/yyyy HH:mm') : 
                            'Sem expiração'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(notification)}>
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}