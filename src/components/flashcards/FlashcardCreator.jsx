import React, { useState } from 'react';
import { Flashcard } from '@/entities/Flashcard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import { PlusCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "D. Constitucional" },
  { value: "direito_administrativo", label: "D. Administrativo" },
  { value: "direito_penal", label: "D. Penal" },
  { value: "direito_civil", label: "D. Civil" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "pedagogia", label: "Pedagogia" },
  { value: "lei_8112", label: "Lei 8.112" },
  { value: "lei_8666", label: "Lei 8.666" },
  { value: "lei_14133", label: "Lei 14.133" },
  { value: "constituicao_federal", label: "Constituição Federal" }
];

export default function FlashcardCreator({ onCreated, onCancel }) {
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    subject: '',
    topic: '',
    deck_name: 'Meus Flashcards',
    difficulty: 'medio',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.front || !formData.back || !formData.subject) {
      toast.error("Preencha os campos obrigatórios: Frente, Verso e Disciplina.");
      return;
    }

    setLoading(true);
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      await Flashcard.create({
        front: formData.front,
        back: formData.back,
        subject: formData.subject,
        topic: formData.topic,
        deck_name: formData.deck_name,
        difficulty: formData.difficulty,
        tags: tagsArray,
        is_active: true
      });

      toast.success("Flashcard criado com sucesso!");
      
      // Limpar formulário ou notificar pai
      setFormData({
        front: '',
        back: '',
        subject: '',
        topic: '',
        deck_name: 'Meus Flashcards',
        difficulty: 'medio',
        tags: ''
      });

      if (onCreated) onCreated();
    } catch (error) {
      console.error("Erro ao criar flashcard:", error);
      toast.error("Erro ao criar flashcard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          Novo Flashcard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(val) => handleChange('subject', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto (Tópico)</Label>
              <Input 
                value={formData.topic} 
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="Ex: Crase, Porcentagem, Atos Administrativos..." 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Frente (Pergunta/Conceito) *</Label>
              <div className="bg-white text-black rounded-md overflow-hidden border">
                <ReactQuill 
                  theme="snow"
                  value={formData.front}
                  onChange={(val) => handleChange('front', val)}
                  className="h-40 mb-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verso (Resposta/Explicação) *</Label>
              <div className="bg-white text-black rounded-md overflow-hidden border">
                <ReactQuill 
                  theme="snow"
                  value={formData.back}
                  onChange={(val) => handleChange('back', val)}
                  className="h-40 mb-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(val) => handleChange('difficulty', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nome do Baralho</Label>
              <Input 
                value={formData.deck_name} 
                onChange={(e) => handleChange('deck_name', e.target.value)}
                placeholder="Ex: Revisão Geral" 
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input 
                value={formData.tags} 
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="importante, prova_x, revisar..." 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Salvando..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Flashcard
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}