import React, { useState, useEffect } from 'react';
import { FAQ } from '@/entities/FAQ';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, HelpCircle } from 'lucide-react';

const categoryOptions = [
  { value: 'pagamento', label: 'Pagamento' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'geral', label: 'Geral' },
  { value: 'tecnico', label: 'Técnico' }
];

export default function AdminFAQForm({ faq, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'geral',
    order: 0,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (faq) {
      setFormData(faq);
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'geral',
        order: 0,
        is_active: true
      });
    }
  }, [faq]);

  const handleInputChange = (field, value) => {
    setError('');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question || !formData.answer) {
      setError('Pergunta e resposta são obrigatórias.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (faq && faq.id) {
        await FAQ.update(faq.id, formData);
      } else {
        await FAQ.create(formData);
      }
      onSave();
    } catch (err) {
      console.error('Erro ao salvar FAQ:', err);
      setError('Erro ao salvar FAQ. Tente novamente.');
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            {faq ? 'Editar FAQ' : 'Adicionar Novo FAQ'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="question">Pergunta *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => handleInputChange('question', e.target.value)}
                placeholder="Digite a pergunta..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="answer">Resposta *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => handleInputChange('answer', e.target.value)}
                placeholder="Digite a resposta..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Ordem de Exibição</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">FAQ Ativo</Label>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-2">{error}</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              faq ? 'Atualizar FAQ' : 'Salvar FAQ'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}