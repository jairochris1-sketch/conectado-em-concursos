import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function QuickResponseManager() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    shortcut: ''
  });

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const data = await base44.entities.QuickResponse.list('-usage_count', 100);
      setResponses(data);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      toast.error('Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    try {
      if (editingId) {
        await base44.entities.QuickResponse.update(editingId, formData);
        toast.success('Resposta atualizada!');
      } else {
        await base44.entities.QuickResponse.create(formData);
        toast.success('Resposta criada!');
      }
      loadResponses();
      handleReset();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar resposta');
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.QuickResponse.delete(id);
      toast.success('Resposta deletada');
      loadResponses();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar resposta');
    }
  };

  const handleEdit = (response) => {
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category || '',
      shortcut: response.shortcut || ''
    });
    setEditingId(response.id);
    setShowForm(true);
  };

  const handleReset = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      shortcut: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência');
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Respostas Rápidas</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Resposta
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
                <CardTitle>{editingId ? 'Editar' : 'Nova'} Resposta Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Título da resposta"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                <Input
                  placeholder="Categoria (ex: Técnico, Planos)"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
                <Input
                  placeholder="Atalho (ex: !tech, !plans)"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({...formData, shortcut: e.target.value})}
                />
                <Textarea
                  placeholder="Conteúdo da resposta..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={5}
                />
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
        {responses.map((response) => (
          <motion.div
            key={response.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{response.title}</h4>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {response.category && (
                          <Badge variant="outline">{response.category}</Badge>
                        )}
                        {response.shortcut && (
                          <Badge className="bg-blue-100 text-blue-800">{response.shortcut}</Badge>
                        )}
                        <Badge variant="secondary">{response.usage_count || 0} usos</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(response.content)}
                        title="Copiar conteúdo">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(response)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(response.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">
                    {response.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {responses.length === 0 && !showForm && (
        <Card className="text-center p-8">
          <p className="text-gray-500">Nenhuma resposta rápida criada ainda</p>
        </Card>
      )}
    </div>
  );
}