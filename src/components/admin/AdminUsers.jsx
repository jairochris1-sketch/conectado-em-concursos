import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      const allUsers = await User.list(null, 500);
      setUsers(allUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
    setLoading(false);
  };

  const filterUsers = () => {
    const filtered = users.filter(u =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await User.update(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Permissão atualizada para ${newRole}`);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar permissão');
    }
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Gerenciador de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profile_photo_url} />
                    <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{user.full_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                    {user.created_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <Badge className={getRoleColor(user.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                  {user.role === 'user' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleChangeRole(user.id, 'admin')}
                      className="text-xs"
                    >
                      Tornar Admin
                    </Button>
                  )}
                  {user.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleChangeRole(user.id, 'user')}
                      className="text-xs"
                    >
                      Remover Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Total: {filteredUsers.length} usuários
          </div>
        </CardContent>
      </Card>
    </div>
  );
}