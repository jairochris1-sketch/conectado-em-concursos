import { useState, useEffect } from 'react';
import { Note, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Star, StarOff, StickyNote, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  administracao_publica: "Administração Pública",
  pedagogia: "Pedagogia"
};

const colorClasses = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  blue: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  green: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  red: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  purple: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  gray: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    topic: '',
    color: 'yellow',
    tags: []
  });

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, selectedSubject, showFavoritesOnly]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userNotes = await Note.filter({ created_by: user.email });
      setNotes(userNotes.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)));
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
    setIsLoading(false);
  };

  const filterNotes = () => {
    let filtered = [...notes];

    if (showFavoritesOnly) {
      filtered = filtered.filter(note => note.is_favorite);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(search) ||
        note.content.toLowerCase().includes(search) ||
        note.topic?.toLowerCase().includes(search)
      );
    }

    setFilteredNotes(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await Note.update(editingNote.id, formData);
      } else {
        await Note.create(formData);
      }
      setShowForm(false);
      setEditingNote(null);
      setFormData({ title: '', content: '', subject: '', topic: '', color: 'yellow', tags: [] });
      loadNotes();
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      subject: note.subject || '',
      topic: note.topic || '',
      color: note.color || 'yellow',
      tags: note.tags || []
    });
    setShowForm(true);
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      try {
        await Note.delete(noteId);
        loadNotes();
      } catch (error) {
        console.error('Erro ao excluir anotação:', error);
      }
    }
  };

  const toggleFavorite = async (note) => {
    try {
      await Note.update(note.id, { is_favorite: !note.is_favorite });
      loadNotes();
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <StickyNote className="w-8 h-8" />
            Minhas Anotações
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to={createPageUrl("FavoriteQuestions")}>
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Questões Favoritas
              </Button>
            </Link>
            <Button
              onClick={() => {
                setEditingNote(null);
              setFormData({ title: '', content: '', subject: '', topic: '', color: 'yellow', tags: [] });
              setShowForm(!showForm);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Anotação
            </Button>
          </div>
        </div>

        {/* Formulário */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>{editingNote ? 'Editar Anotação' : 'Nova Anotação'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Título da anotação"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Conteúdo da anotação"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(subjectNames).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Assunto específico"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    />
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yellow">Amarelo</SelectItem>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="gray">Cinza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingNote(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">{editingNote ? 'Salvar' : 'Criar'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar anotações..."
                  className="pl-10"
                />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {Object.entries(subjectNames).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className="w-4 h-4 mr-2" />
                {showFavoritesOnly ? 'Mostrando Favoritas' : 'Mostrar Favoritas'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Anotações */}
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StickyNote className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Nenhuma anotação encontrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className={`${colorClasses[note.color || 'yellow']} border-2 hover:shadow-xl transition-all`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(note)}
                          >
                            {note.is_favorite ? (
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            ) : (
                              <StarOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(note)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(note.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {note.subject && (
                        <Badge variant="outline" className="mt-2 w-fit">
                          {subjectNames[note.subject]}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        {new Date(note.updated_date).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}