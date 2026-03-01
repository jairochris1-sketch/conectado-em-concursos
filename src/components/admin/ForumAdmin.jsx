import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, MessageSquare, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { ForumPost, ForumReply } from '@/entities/all';

const defaultCategories = [
  { value: "depoimentos", label: "Depoimentos de Aprovação", order: 1, is_active: true },
  { value: "dicas_estudos", label: "Dicas de Estudos", order: 2, is_active: true },
  { value: "motivacao", label: "Motivação", order: 3, is_active: true },
  { value: "organizacao", label: "Organização e Rotina", order: 4, is_active: true },
  { value: "portugues", label: "Português", order: 5, is_active: true },
  { value: "matematica", label: "Matemática", order: 6, is_active: true },
  { value: "direito_constitucional", label: "Direito Constitucional", order: 7, is_active: true },
  { value: "direito_administrativo", label: "Direito Administrativo", order: 8, is_active: true },
  { value: "informatica", label: "Informática", order: 9, is_active: true },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais", order: 10, is_active: true },
  { value: "outros", label: "Outros Assuntos", order: 11, is_active: true }
];

export default function ForumAdmin() {
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);

  // Category modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ value: '', label: '', order: 0, is_active: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPosts, fetchedReplies, fetchedCategories] = await Promise.all([
        ForumPost.list('-created_date', 100),
        ForumReply.list('-created_date', 100),
        base44.entities.ForumCategory.list('order')
      ]);

      setPosts(fetchedPosts || []);
      setReplies(fetchedReplies || []);
      
      if (!fetchedCategories || fetchedCategories.length === 0) {
        // Seed default categories se não existir
        for (const cat of defaultCategories) {
          await base44.entities.ForumCategory.create(cat);
        }
        setCategories(defaultCategories);
      } else {
        setCategories(fetchedCategories);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados do fórum');
    }
    setLoading(false);
  };

  // Delete Handlers
  const handleDeletePost = async (id) => {
    if (!window.confirm('Excluir este post e todas as suas respostas?')) return;
    try {
      const postReplies = replies.filter(r => r.post_id === id);
      await Promise.all(postReplies.map(r => ForumReply.delete(r.id)));
      await ForumPost.delete(id);
      toast.success('Post excluído com sucesso');
      loadData();
    } catch (e) {
      toast.error('Erro ao excluir post');
    }
  };

  const handleDeleteReply = async (id) => {
    if (!window.confirm('Excluir esta resposta?')) return;
    try {
      await ForumReply.delete(id);
      toast.success('Resposta excluída');
      loadData();
    } catch (e) {
      toast.error('Erro ao excluir resposta');
    }
  };

  // Category Handlers
  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ value: cat.value, label: cat.label, order: cat.order, is_active: cat.is_active });
    } else {
      setEditingCategory(null);
      setCategoryForm({ value: '', label: '', order: categories.length + 1, is_active: true });
    }
    setIsCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.value || !categoryForm.label) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    try {
      if (editingCategory) {
        await base44.entities.ForumCategory.update(editingCategory.id, categoryForm);
        toast.success('Categoria atualizada');
      } else {
        await base44.entities.ForumCategory.create(categoryForm);
        toast.success('Categoria criada');
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (e) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await base44.entities.ForumCategory.delete(id);
      toast.success('Categoria excluída');
      loadData();
    } catch (e) {
      toast.error('Erro ao excluir categoria');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando Fórum...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Gerenciamento do Fórum
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Respostas</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openCategoryModal()}>
                <Plus className="w-4 h-4 mr-2" /> Nova Categoria
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.order}</TableCell>
                    <TableCell className="font-medium">{cat.label}</TableCell>
                    <TableCell>{cat.value}</TableCell>
                    <TableCell>
                      {cat.is_active ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openCategoryModal(cat)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="posts">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell>{new Date(post.created_date).toLocaleDateString()}</TableCell>
                    <TableCell>{post.author_name}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={post.title}>{post.title}</TableCell>
                    <TableCell>{post.subject}</TableCell>
                    <TableCell>{post.replies_count || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="replies">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map(reply => (
                  <TableRow key={reply.id}>
                    <TableCell>{new Date(reply.created_date).toLocaleDateString()}</TableCell>
                    <TableCell>{reply.author_name}</TableCell>
                    <TableCell className="max-w-[400px] truncate" title={reply.content}>{reply.content}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteReply(reply.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome de Exibição (Label)</Label>
              <Input value={categoryForm.label} onChange={e => setCategoryForm({...categoryForm, label: e.target.value})} placeholder="Ex: Dicas de Estudos" />
            </div>
            <div>
              <Label>Valor Interno (Value)</Label>
              <Input value={categoryForm.value} onChange={e => setCategoryForm({...categoryForm, value: e.target.value})} placeholder="Ex: dicas_estudos" />
            </div>
            <div>
              <Label>Ordem de Exibição</Label>
              <Input type="number" value={categoryForm.order} onChange={e => setCategoryForm({...categoryForm, order: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={categoryForm.is_active} onCheckedChange={c => setCategoryForm({...categoryForm, is_active: c})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}