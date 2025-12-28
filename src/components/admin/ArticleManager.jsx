import { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Topic } from '@/entities/Topic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { BookOpen, Plus, Edit, Trash2, Save, X } from 'lucide-react';

const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "direito_penal", label: "Direito Penal" },
  { value: "direito_civil", label: "Direito Civil" },
  { value: "direito_tributario", label: "Direito Tributário" },
  { value: "direito_previdenciario", label: "Direito Previdenciário" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "administracao_publica", label: "Administração Pública" },
  { value: "pedagogia", label: "Pedagogia" }
];

const categoryOptions = [
  { value: "teoria", label: "Teoria" },
  { value: "resumo", label: "Resumo" },
  { value: "dica", label: "Dica de Estudo" },
  { value: "atualidade", label: "Atualidade" },
  { value: "jurisprudencia", label: "Jurisprudência" },
  { value: "legislacao", label: "Legislação" }
];

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

export default function ArticleManager() {
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    subject: '',
    topic: '',
    category: 'teoria',
    author: '',
    reading_time: 5,
    cover_image_url: '',
    tags: [],
    is_featured: false,
    is_published: true,
    order: 0
  });

  const [tagInput, setTagInput] = useState('');
  const [filteredTopics, setFilteredTopics] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      const subjectTopics = topics.filter(t => t.subject === formData.subject);
      setFilteredTopics(subjectTopics);
    } else {
      setFilteredTopics([]);
    }
  }, [formData.subject, topics]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [articlesData, topicsData] = await Promise.all([
        Article.list('-created_date'),
        Topic.list()
      ]);
      setArticles(articlesData);
      setTopics(topicsData);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
      alert('Erro ao carregar dados.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.subject) {
      alert('Por favor, preencha título, conteúdo e disciplina.');
      return;
    }

    try {
      if (editingArticle) {
        await Article.update(editingArticle.id, formData);
        alert('Artigo atualizado com sucesso!');
      } else {
        await Article.create(formData);
        alert('Artigo criado com sucesso!');
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar artigo:', error);
      alert('Erro ao salvar artigo.');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary || '',
      subject: article.subject,
      topic: article.topic || '',
      category: article.category,
      author: article.author || '',
      reading_time: article.reading_time || 5,
      cover_image_url: article.cover_image_url || '',
      tags: article.tags || [],
      is_featured: article.is_featured || false,
      is_published: article.is_published !== false,
      order: article.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Tem certeza que deseja excluir este artigo?')) {
      try {
        await Article.delete(articleId);
        alert('Artigo excluído com sucesso!');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir artigo:', error);
        alert('Erro ao excluir artigo.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      subject: '',
      topic: '',
      category: 'teoria',
      author: '',
      reading_time: 5,
      cover_image_url: '',
      tags: [],
      is_featured: false,
      is_published: true,
      order: 0
    });
    setEditingArticle(null);
    setShowForm(false);
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

  const articlesBySubject = articles.reduce((acc, article) => {
    (acc[article.subject] = acc[article.subject] || []).push(article);
    return acc;
  }, {});

  if (showForm) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
          </h2>
          <Button variant="outline" onClick={resetForm}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Digite o título do artigo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="Nome do autor"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Disciplina *</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData({...formData, subject: value, topic: ''})}
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
                  <Label htmlFor="topic">Assunto</Label>
                  <Select 
                    value={formData.topic} 
                    onValueChange={(value) => setFormData({...formData, topic: value})}
                    disabled={!formData.subject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTopics.map(topic => (
                        <SelectItem key={topic.id} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reading_time">Tempo de Leitura (min)</Label>
                  <Input
                    id="reading_time"
                    type="number"
                    min="1"
                    value={formData.reading_time}
                    onChange={(e) => setFormData({...formData, reading_time: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Resumo (Descrição Breve)</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Um breve resumo do artigo..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="cover_image_url">URL da Imagem de Capa</Label>
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                  placeholder="https://exemplo.com/imagem.jpg"
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
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-black/10 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span>Artigo em Destaque</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span>Publicado</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Artigo *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px]">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  modules={quillModules}
                  placeholder="Escreva o conteúdo do artigo aqui..."
                  className="h-[350px]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              {editingArticle ? 'Atualizar Artigo' : 'Publicar Artigo'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Gerenciar Artigos
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Carregando artigos...</p>
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum artigo criado ainda.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Criar Primeiro Artigo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(articlesBySubject).sort().map(subject => {
            const subjectLabel = subjectOptions.find(s => s.value === subject)?.label || subject;
            return (
              <Card key={subject}>
                <CardHeader>
                  <CardTitle className="text-lg">{subjectLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...articlesBySubject[subject]].sort((a,b) => {
                        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
                        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
                        if (ao !== bo) return ao - bo;
                        return (a.title || '').localeCompare(b.title || '', 'pt-BR', { numeric: true });
                      }).map(article => (
                      <div key={article.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {article.title}
                            </h3>
                            {article.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">Destaque</Badge>
                            )}
                            {!article.is_published && (
                              <Badge variant="secondary">Rascunho</Badge>
                            )}
                          </div>
                          {article.summary && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {article.topic && (
                              <Badge variant="outline">{article.topic}</Badge>
                            )}
                            <span>{categoryOptions.find(c => c.value === article.category)?.label}</span>
                            {article.reading_time && <span>• {article.reading_time} min</span>}
                            {article.views_count > 0 && (
                              <span>• {article.views_count} visualizações</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(article)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(article.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}