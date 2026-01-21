import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SpecialUserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    plan: 'avancado',
    reason: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await base44.entities.SpecialUser.list('-created_date', 100);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários especiais:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email.trim()) {
      toast.error('Preencha o email');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    try {
      if (editingId) {
        await base44.entities.SpecialUser.update(editingId, formData);
        toast.success('Usuário atualizado!');
      } else {
        await base44.entities.SpecialUser.create(formData);
        toast.success('Usuário especial adicionado!');
      }
      loadUsers();
      handleReset();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remover acesso especial deste usuário?')) {
      try {
        await base44.entities.SpecialUser.delete(id);
        toast.success('Usuário removido');
        loadUsers();
      } catch (error) {
        console.error('Erro ao deletar:', error);
        toast.error('Erro ao deletar usuário');
      }
    }
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      plan: user.plan,
      reason: user.reason || '',
      valid_until: user.valid_until || '',
      is_active: user.is_active !== false
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleReset = () => {
    setFormData({
      email: '',
      plan: 'avancado',
      reason: '',
      valid_until: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Usuários Especiais/Isentos</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? 'Editar' : 'Adicionar'} Usuário Especial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Email do usuário"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                
                <Select value={formData.plan} onValueChange={(value) => 
                  setFormData({...formData, plan: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Plano Padrão</SelectItem>
                    <SelectItem value="avancado">Plano Avançado</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Motivo (ex: Teste, Demo, Parceria)"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  rows={2}
                />

                <div>
                  <label className="text-sm font-medium mb-1 block">Válido até (opcional)</label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="text-sm">Ativo</span>
                </label>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700">
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}>
            <Card className={`hover:shadow-md transition-all ${!user.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="font-semibold text-gray-900">{user.email}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.plan === 'avancado' ? 'Plano Avançado' : 'Plano Padrão'}
                        </Badge>
                        {!user.is_active && (
                          <Badge className="bg-gray-300 text-gray-800">Inativo</Badge>
                        )}
                        {user.valid_until && (
                          <Badge className={isExpired(user.valid_until) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            Até {new Date(user.valid_until).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                      {user.reason && (
                        <p className="text-sm text-gray-600 mt-2">📝 {user.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(user)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {users.length === 0 && !showForm && (
        <Card className="text-center p-8">
          <p className="text-gray-500">Nenhum usuário especial adicionado ainda</p>
        </Card>
      )}
    </div>
  );
}