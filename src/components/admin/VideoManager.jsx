import { useState, useEffect } from 'react';
import { YouTubeVideo } from '@/entities/YouTubeVideo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Play, Loader2, X, Save, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  direito_tributario: "Direito Tributário",
  direito_previdenciario: "Direito Previdenciário",
  direito_eleitoral: "Direito Eleitoral",
  direito_ambiental: "Direito Ambiental",
  administracao_geral: "Administração Geral",
  administracao_publica: "Administração Pública",
  administracao_recursos_materiais: "Administração de Recursos Materiais",
  afo: "AFO",
  financas_publicas: "Finanças Públicas",
  etica_administracao: "Ética na Administração",
  arquivologia: "Arquivologia",
  atendimento_publico: "Atendimento ao Público",
  direitos_humanos: "Direitos Humanos",
  eca: "ECA",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  legislacao_especifica: "Legislação Específica",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  economia: "Economia",
  estatistica: "Estatística",
  pedagogia: "Pedagogia",
  lei_8112: "Lei 8.112/90",
  lei_8666: "Lei 8.666/93",
  lei_14133: "Lei 14.133/21",
  constituicao_federal: "Constituição Federal",
  regimento_interno: "Regimento Interno",
  seguranca_publica: "Segurança Pública",
  legislacao_estadual: "Legislação Estadual",
  legislacao_municipal: "Legislação Municipal"
};

export default function VideoManager() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    subject: 'portugues',
    topic: '',
    description: '',
    duration: '',
    instructor: '',
    order: 0,
    is_active: true
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const videosData = await YouTubeVideo.list('order');
      setVideos(videosData);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar vídeos');
    }
    setIsLoading(false);
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const videoId = extractYouTubeId(formData.youtube_url);
      if (!videoId) {
        toast.error('URL do YouTube inválida');
        return;
      }

      const videoData = {
        ...formData,
        video_id: videoId
      };

      if (editingVideo) {
        await YouTubeVideo.update(editingVideo.id, videoData);
        toast.success('Vídeo atualizado com sucesso!');
      } else {
        await YouTubeVideo.create(videoData);
        toast.success('Vídeo adicionado com sucesso!');
      }

      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast.error('Erro ao salvar vídeo');
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      youtube_url: video.youtube_url,
      subject: video.subject,
      topic: video.topic || '',
      description: video.description || '',
      duration: video.duration || '',
      instructor: video.instructor || '',
      order: video.order || 0,
      is_active: video.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;
    
    try {
      await YouTubeVideo.delete(id);
      toast.success('Vídeo excluído com sucesso!');
      loadVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error('Erro ao excluir vídeo');
    }
  };

  const handleMoveUp = async (video, index) => {
    if (index === 0) return;
    
    const previousVideo = videos[index - 1];
    await YouTubeVideo.update(video.id, { order: previousVideo.order });
    await YouTubeVideo.update(previousVideo.id, { order: video.order });
    loadVideos();
  };

  const handleMoveDown = async (video, index) => {
    if (index === videos.length - 1) return;
    
    const nextVideo = videos[index + 1];
    await YouTubeVideo.update(video.id, { order: nextVideo.order });
    await YouTubeVideo.update(nextVideo.id, { order: video.order });
    loadVideos();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      youtube_url: '',
      subject: 'portugues',
      topic: '',
      description: '',
      duration: '',
      instructor: '',
      order: 0,
      is_active: true
    });
    setEditingVideo(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Vídeo-Aulas</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Cancelar' : 'Adicionar Vídeo'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Título do Vídeo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Aula de Português - Crase"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="youtube_url">URL do YouTube *</Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Disciplina *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(subjectNames).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="topic">Assunto</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="Ex: Uso da Crase"
                  />
                </div>

                <div>
                  <Label htmlFor="instructor">Professor</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="Nome do professor"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duração</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ex: 15:30"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do conteúdo do vídeo"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="order">Ordem de Exibição</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Vídeo Ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingVideo ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ordem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan="6" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="6" className="text-center py-8">
                    Nenhum vídeo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video, index) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(video, index)}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(video, index)}
                          disabled={index === videos.length - 1}
                        >
                          <MoveDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="flex items-center gap-3">
                        <Play className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{video.title}</div>
                          {video.topic && (
                            <div className="text-sm text-gray-500">{video.topic}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {subjectNames[video.subject] || video.subject}
                      </Badge>
                    </TableCell>
                    <TableCell>{video.instructor || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={video.is_active ? 'default' : 'secondary'}>
                        {video.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(video.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}