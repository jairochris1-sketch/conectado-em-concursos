import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AutoResponseManager() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    keywords: [],
    response_text: '',
    trigger_type: 'contains',
    case_sensitive: false,
    priority: 0,
    is_active: true
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const data = await base44.entities.AutoResponse.list('-priority', 100);
      setResponses(data);
    } catch (error) {
      console.error('Erro ao carregar respostas automáticas:', error);
      toast.error('Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    });
  };

  const handleSave = async () => {
    if (!formData.keywords.length || !formData.response_text.trim()) {
      toast.error('Preencha palavras-chave e resposta');
      return;
    }

    try {
      if (editingId) {
        await base44.entities.AutoResponse.update(editingId, formData);
        toast.success('Resposta automática atualizada!');
      } else {
        await base44.entities.AutoResponse.create(formData);
        toast.success('Resposta automática criada!');
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
      await base44.entities.AutoResponse.delete(id);
      toast.success('Resposta deletada');
      loadResponses();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar resposta');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await base44.entities.AutoResponse.update(id, { is_active: !currentStatus });
      loadResponses();
      toast.success(currentStatus ? 'Desativada' : 'Ativada');
    } catch (error) {
      console.error('Erro ao toggle:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleEdit = (response) => {
    setFormData({
      keywords: response.keywords || [],
      response_text: response.response_text,
      trigger_type: response.trigger_type || 'contains',
      case_sensitive: response.case_sensitive || false,
      priority: response.priority || 0,
      is_active: response.is_active !== false
    });
    setEditingId(response.id);
    setShowForm(true);
  };

  const handleReset = () => {
    setFormData({
      keywords: [],
      response_text: '',
      trigger_type: 'contains',
      case_sensitive: false,
      priority: 0,
      is_active: true
    });
    setKeywordInput('');
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Respostas Automáticas</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
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
                <CardTitle>{editingId ? 'Editar' : 'Nova'} Resposta Automática</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Palavras-chave</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Digite a palavra-chave"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} variant="outline">Adicionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-red-600">
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Correspondência</label>
                    <Select value={formData.trigger_type} onValueChange={(value) => 
                      setFormData({...formData, trigger_type: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="starts_with">Começa com</SelectItem>
                        <SelectItem value="ends_with">Termina com</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Prioridade</label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.case_sensitive}
                    onChange={(e) => setFormData({...formData, case_sensitive: e.target.checked})}
                  />
                  <span className="text-sm">Sensível a maiúsculas</span>
                </label>

                <Textarea
                  placeholder="Resposta automática..."
                  value={formData.response_text}
                  onChange={(e) => setFormData({...formData, response_text: e.target.value})}
                  rows={4}
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
            <Card className={`hover:shadow-md transition-all ${!response.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex gap-2 flex-wrap">
                        {response.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="secondary">{response.trigger_type}</Badge>
                        <Badge variant="secondary">Prioridade: {response.priority}</Badge>
                        {!response.is_active && (
                          <Badge className="bg-gray-300 text-gray-800">Inativa</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggle(response.id, response.is_active)}
                        className={response.is_active ? 'text-green-600' : 'text-gray-400'}>
                        <Power className="w-4 h-4" />
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
                    {response.response_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {responses.length === 0 && !showForm && (
        <Card className="text-center p-8">
          <p className="text-gray-500">Nenhuma resposta automática configurada</p>
        </Card>
      )}
    </div>
  );
}