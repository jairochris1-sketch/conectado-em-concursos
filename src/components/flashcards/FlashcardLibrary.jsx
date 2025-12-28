
import { useState } from 'react';
import { Flashcard } from '@/entities/Flashcard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Pencil
} from 'lucide-react';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "D. Constitucional",
  direito_administrativo: "D. Administrativo",
  direito_penal: "D. Penal",
  direito_civil: "D. Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  pedagogia: "Pedagogia"
};

const difficultyColors = {
  facil: "bg-green-100 text-green-800",
  medio: "bg-yellow-100 text-yellow-800",
  dificil: "bg-red-100 text-red-800"
};

export default function FlashcardLibrary({ flashcards, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showBack, setShowBack] = useState(false);

  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = searchTerm === '' || 
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === 'all' || card.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const handleDelete = async (cardId) => {
    if (window.confirm('Tem certeza que deseja excluir este flashcard?')) {
      try {
        await Flashcard.delete(cardId);
        onUpdate();
      } catch (error) {
        console.error('Erro ao excluir flashcard:', error);
        alert('Erro ao excluir flashcard.');
      }
    }
  };

  const handleEdit = (card) => {
    // Esta função pode ser expandida para abrir um modal de edição.
    console.log("Editar flashcard:", card);
    alert("A funcionalidade de edição de flashcards será implementada em breve!");
  };

  const toggleCardStatus = async (card) => {
    try {
      await Flashcard.update(card.id, { is_active: !card.is_active });
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status do flashcard:', error);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtrar Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por conteúdo..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {Object.entries(subjectNames).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Flashcards */}
      <div className="grid gap-4">
        {filteredFlashcards.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum flashcard encontrado
              </h3>
              <p className="text-gray-600">
                {flashcards.length === 0 
                  ? 'Crie seus primeiros flashcards na aba "Criar"'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFlashcards.map((card) => (
            <Card key={card.id} className={`hover:shadow-lg transition-all duration-200 ${!card.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-indigo-100 text-indigo-800">
                      {subjectNames[card.subject]}
                    </Badge>
                    {card.difficulty && (
                      <Badge className={difficultyColors[card.difficulty]}>
                        {card.difficulty}
                      </Badge>
                    )}
                    {card.topic && (
                      <Badge variant="outline">
                        {card.topic}
                      </Badge>
                    )}
                    {!card.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(card)}
                      title="Editar Flashcard"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleCardStatus(card)}
                      title={card.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {card.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(card.id)}
                      title="Excluir Flashcard"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Frente:</h4>
                    <div 
                      className="text-gray-700 p-3 bg-gray-50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: card.front }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Verso:</h4>
                    <div 
                      className="text-gray-700 p-3 bg-gray-50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: card.back }}
                    />
                  </div>
                </div>

                {card.tags && card.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
