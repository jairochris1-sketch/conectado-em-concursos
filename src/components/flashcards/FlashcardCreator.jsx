import React, { useState } from 'react';
import { Flashcard } from '@/entities/Flashcard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X } from 'lucide-react';

const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "direito_penal", label: "Direito Penal" },
  { value: "direito_civil", label: "Direito Civil" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "pedagogia", label: "Pedagogia" }
];

const difficultyOptions = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" }
];

export default function FlashcardCreator({ onFlashcardCreated }) {
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    subject: '',
    topic: '',
    deck_name: '',
    difficulty: 'medio',
    tags: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.front.trim() || !formData.back.trim() || !formData.subject) {
      alert('Por favor, preencha pelo menos a frente, verso e disciplina do cartão.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Flashcard.create(formData);
      
      // Limpar formulário
      setFormData({
        front: '',
        back: '',
        subject: '',
        topic: '',
        deck_name: '',
        difficulty: 'medio',
        tags: []
      });
      
      onFlashcardCreated();
      alert('Flashcard criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar flashcard:', error);
      alert('Erro ao criar flashcard. Tente novamente.');
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Criar Novo Flashcard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Disciplina *</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => handleInputChange('subject', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Tópico</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="Ex: Morfologia, Sintaxe..."
              />
            </div>

            <div>
              <Label htmlFor="deck_name">Nome do Baralho</Label>
              <Input
                id="deck_name"
                value={formData.deck_name}
                onChange={(e) => handleInputChange('deck_name', e.target.value)}
                placeholder="Ex: Português - Básico"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="front">Frente do Cartão (Pergunta) *</Label>
            <Textarea
              id="front"
              value={formData.front}
              onChange={(e) => handleInputChange('front', e.target.value)}
              placeholder="Digite a pergunta ou conceito..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="back">Verso do Cartão (Resposta) *</Label>
            <Textarea
              id="back"
              value={formData.back}
              onChange={(e) => handleInputChange('back', e.target.value)}
              placeholder="Digite a resposta ou explicação..."
              rows={4}
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Digite uma tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-indigo-200 rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Criando...' : 'Criar Flashcard'}
            <Save className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}