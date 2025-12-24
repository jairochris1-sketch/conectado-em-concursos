import { useState, useEffect } from 'react';
import { StudyMaterial, Flashcard, FlashcardReview, User, YouTubeVideo, Article } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  FileText,
  Search,
  Eye,
  RefreshCw,
  Filter,
  Upload,
  Trash2,
  Brain,
  Plus,
  Play,
  BarChart3,
  Timer,
  X,
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  Printer,
  User as UserIcon, // Renamed to avoid conflict with entity User
  Moon,
  Sun
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Folder } from 'lucide-react';

import StudyMaterialViewer from '../components/studies/StudyMaterialViewer';
import StudyMaterialUploader from '../components/studies/StudyMaterialUploader';
import FlashcardCreator from '../components/flashcards/FlashcardCreator';
import FlashcardReviewer from '../components/flashcards/FlashcardReviewer';
import FlashcardStats from '../components/flashcards/FlashcardStats';
import FlashcardLibrary from '../components/flashcards/FlashcardLibrary';

const cargoOptions = [
  { value: "all", label: "Todos os Cargos" },
  { value: "materiais_questoes", label: "📝 Materiais de Questões" },
  { value: "tecnico_judiciario", label: "Técnico Judiciário" },
  { value: "analista_judiciario", label: "Analista Judiciário" },
  { value: "agente_penitenciario", label: "Agente Penitenciário" },
  { value: "policial_civil", label: "Policial Civil" },
  { value: "policial_federal", label: "Policial Federal" },
  { value: "auditor_fiscal", label: "Auditor Fiscal" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "analista_receita_federal", label: "Analista da Receita Federal" },
  { value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
  { value: "professor_portugues", label: "Professor (Português)" },
  { value: "professor_matematica", label: "Professor (Matemática)" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "medico", label: "Médico" },
  { value: "contador", label: "Contador" },
  { value: "advogado", label: "Advogado" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "analista_sistemas", label: "Analista de Sistemas" },
  { value: "tecnico_informatica", label: "Técnico em Informática" },
  { value: "assistente_administrativo", label: "Assistente Administrativo" },
  { value: "escriturario", label: "Escriturário" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "analista_bancario", label: "Analista Bancário" }
];

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
  pedagogia: "Pedagogia",
  lei_8112: "Lei 8.112/90",
  lei_8666: "Lei 8.666/93",
  lei_14133: "Lei 14.133/21",
  constituicao_federal: "Constituição Federal"
};

const typeNames = {
  teoria: "Teoria",
  revisao: "Revisão",
  exercicio: "Exercício",
  resumo: "Resumo",
  leis: "Leis"
};

const typeColors = {
  teoria: "bg-blue-100 text-blue-800",
  revisao: "bg-green-100 text-green-800",
  exercicio: "bg-purple-100 text-purple-800",
  resumo: "bg-orange-100 text-orange-800",
  leis: "bg-amber-100 text-amber-800"
};

const VIEW_MODES = {
  EXTRA_LARGE: 'extra_large',
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
  LIST: 'list',
  DETAILS: 'details',
  BLOCKS: 'blocks'
};

const LAYOUT_MODES = {
  GRID: 'grid',
  LIST: 'list',
  COMPACT: 'compact',
  BLOCKS: 'blocks'
};

export default function StudiesPage() {
  // State for Study Materials
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  // Exibição de materiais
  const [materialsView, setMaterialsView] = useState('blocks'); // 'blocks' | 'list'
  const [activeFolder, setActiveFolder] = useState(null); // chave da disciplina

  // State for Flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cardsDueToday, setCardsDueToday] = useState([]);

  // State for YouTube Videos
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedVideoSubject, setSelectedVideoSubject] = useState('all');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoNotes, setVideoNotes] = useState(''); // New state for video notes

  // Paginação de vídeos
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const videosPerPage = 40;

  // State for Articles
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedArticleSubject, setSelectedArticleSubject] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleDarkMode, setArticleDarkMode] = useState(false); // New state for article dark mode
  
  // New state for search
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [videoSearchTerm, setVideoSearchTerm] = useState('');

  // NEW: Article pagination state
  const [currentArticlePage, setCurrentArticlePage] = useState(1);
  const articlesPerPage = 20;

  // General State
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [materialsData, flashcardsData, reviewsData, videosData, articlesData] = await Promise.all([
        StudyMaterial.list('-created_date'),
        Flashcard.list('-created_date'),
        FlashcardReview.list('-created_date'),
        YouTubeVideo.filter({ is_active: true }),
        Article.filter({ is_published: true })
      ]);

      // Process Study Materials
      setMaterials(materialsData);
      setFilteredMaterials(materialsData); // Initialize filtered materials with all materials

      // Process Flashcards
      setFlashcards(flashcardsData);
      setReviews(reviewsData);

      // Process Videos
      setVideos(videosData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setFilteredVideos(videosData.sort((a, b) => (a.order || 0) - (b.order || 0))); // Initialize filtered videos with all videos

      // Process Articles
      setArticles(articlesData.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.order || 0) - (b.order || 0)));
      setFilteredArticles(articlesData.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.order || 0) - (b.order || 0)));

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      const dueCards = flashcardsData.filter(card => {
        // Find the latest review for this card
        const latestReview = reviewsData
          .filter(r => r.flashcard_id === card.id)
          .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];

        // If no review, it's due
        if (!latestReview) return true;

        // If there's a review, check its next_review_date
        const nextReviewDate = new Date(latestReview.next_review_date);
        nextReviewDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
        
        return nextReviewDate <= today;
      });

      setCardsDueToday(dueCards);

    } catch (error) {
      console.error('Erro ao carregar dados da área de estudos:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const filterMaterials = () => {
      let filtered = [...materials];

      if (selectedCargo !== 'all') {
        filtered = filtered.filter(material => material.cargo === selectedCargo);
      }

      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(material =>
          material.title.toLowerCase().includes(search) ||
          material.description?.toLowerCase().includes(search) ||
          subjectNames[material.subject]?.toLowerCase().includes(search)
        );
      }

      setFilteredMaterials(filtered);
    };

    filterMaterials();
  }, [materials, selectedCargo, searchTerm]);

  useEffect(() => {
    let filtered = [...articles];
    
    if (selectedArticleSubject !== 'all') {
      filtered = filtered.filter(article => article.subject === selectedArticleSubject);
    }
    
    if (articleSearchTerm.trim()) {
      const search = articleSearchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(search) ||
        article.summary?.toLowerCase().includes(search) ||
        article.topic?.toLowerCase().includes(search)
      );
    }
    
    setFilteredArticles(filtered.sort((a, b) => 
      (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.order || 0) - (b.order || 0)
    ));
  }, [selectedArticleSubject, articles, articleSearchTerm]);

  useEffect(() => {
    let filtered = [...videos];
    
    if (selectedVideoSubject !== 'all') {
      filtered = filtered.filter(video => video.subject === selectedVideoSubject);
    }
    
    if (videoSearchTerm.trim()) {
      const search = videoSearchTerm.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(search) ||
        video.description?.toLowerCase().includes(search) ||
        video.instructor?.toLowerCase().includes(search) ||
        video.topic?.toLowerCase().includes(search)
      );
    }
    
    setFilteredVideos(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [selectedVideoSubject, videos, videoSearchTerm]);

  const getFlashcardStats = () => {
    const totalCards = flashcards.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    const reviewedTodayCount = reviews.filter(r => {
      const reviewDate = new Date(r.created_date);
      return reviewDate >= today && reviewDate < tomorrow;
    }).length;

    // Calculate average easiness factor from all reviews
    const avgEasiness = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.easiness_factor || 2.5), 0) / reviews.length
      : 2.5;

    return {
      totalCards,
      cardsDue: cardsDueToday.length,
      reviewedToday: reviewedTodayCount,
      avgEasiness: Math.round(avgEasiness * 100) / 100
    };
  };

  const flashcardStats = getFlashcardStats();

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
  };

  const handleDeleteMaterial = async (e, materialId) => {
    e.stopPropagation(); // Impede que o clique no botão de excluir abra o modal de visualização
    if(window.confirm("Tem certeza que deseja excluir este material de estudo? Esta ação não pode ser desfeita.")) {
      try {
        await StudyMaterial.delete(materialId);
        await loadAllData(); // Recarrega a lista após a exclusão
        alert("Material excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir material:", error);
        alert("Ocorreu um erro ao excluir o material.");
      }
    }
  };

  const isAdmin = currentUser && currentUser.email === 'conectadoemconcursos@gmail.com';

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePlayVideo = (video) => {
    setPlayingVideo(video);
    // Carregar anotações salvas no localStorage
    const savedNotes = localStorage.getItem(`video_notes_${video.id}`);
    setVideoNotes(savedNotes || '');
  };

  const handleCloseVideo = () => {
    // Salvar anotações antes de fechar
    if (playingVideo) {
      localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);
    }
    setPlayingVideo(null);
    setVideoNotes('');
  };

  const handlePreviousVideo = () => {
    if (!playingVideo) return;
    
    // Salvar anotações do vídeo atual
    localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);
    
    const currentIndex = filteredVideos.findIndex(v => v.id === playingVideo.id);
    if (currentIndex > 0) {
      const previousVideo = filteredVideos[currentIndex - 1];
      handlePlayVideo(previousVideo);
    }
  };

  const handleNextVideo = () => {
    if (!playingVideo) return;
    
    // Salvar anotações do vídeo atual
    localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);
    
    const currentIndex = filteredVideos.findIndex(v => v.id === playingVideo.id);
    if (currentIndex < filteredVideos.length - 1) {
      const nextVideo = filteredVideos[currentIndex + 1];
      handlePlayVideo(nextVideo);
    }
  };

  const handleSaveNotes = () => {
    if (playingVideo) {
      localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);
      alert('Anotações salvas com sucesso!');
    }
  };

  const handleDownloadNotes = () => {
    if (!playingVideo || !videoNotes.trim()) {
      alert('Não há anotações para baixar.');
      return;
    }

    const content = `
ANOTAÇÕES - ${playingVideo.title}
${playingVideo.instructor ? `Professor: ${playingVideo.instructor}` : ''}
Disciplina: ${subjectNames[playingVideo.subject] || playingVideo.subject}
${playingVideo.topic ? `Assunto: ${playingVideo.topic}` : ''}
Data: ${new Date().toLocaleDateString('pt-BR')}

────────────────────────────────────────

${videoNotes}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anotacoes-${playingVideo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintNotes = () => {
    if (!playingVideo || !videoNotes.trim()) {
      alert('Não há anotações para imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Anotações - ${playingVideo.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #333; /* Ensure text is visible in print */
          }
          h1 {
            color: #333;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .meta {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .meta p {
            margin: 5px 0;
          }
          .content {
            white-space: pre-wrap;
            line-height: 1.6;
            word-wrap: break-word;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Anotações - ${playingVideo.title}</h1>
        <div class="meta">
          ${playingVideo.instructor ? `<p><strong>Professor:</strong> ${playingVideo.instructor}</p>` : ''}
          <p><strong>Disciplina:</strong> ${subjectNames[playingVideo.subject] || playingVideo.subject}</p>
          ${playingVideo.topic ? `<p><strong>Assunto:</strong> ${playingVideo.topic}</p>` : ''}
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="content">${videoNotes}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleArticleClick = async (article) => {
    setSelectedArticle(article);
    setArticleDarkMode(false); // Reset dark mode when opening new article
    // Incrementar contador de visualizações
    try {
      await Article.update(article.id, { 
        views_count: (article.views_count || 0) + 1 
      });
    } catch (error) {
      console.error('Erro ao atualizar views:', error);
    }
  };

  // Calcular vídeos da página atual
  const indexOfLastVideo = currentVideoPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalVideoPages = Math.ceil(filteredVideos.length / videosPerPage);

  // NEW: Calculate paginated articles
  const indexOfLastArticle = currentArticlePage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalArticlePages = Math.ceil(filteredArticles.length / articlesPerPage);
  
  if (isLoading) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando área de estudos...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8" /> Área de Estudos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Seus materiais, resumos e flashcards, tudo em um só lugar.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowUploader(!showUploader)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Material
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Artigos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Vídeo-Aulas
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Flashcards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-6">
            {/* Uploader - apenas para admin */}
            {showUploader && isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <StudyMaterialUploader
                  onMaterialUploaded={loadAllData}
                  onCancel={() => setShowUploader(false)}
                />
              </motion.div>
            )}

            {/* Filtros */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros de Busca de Materiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Selecionar Cargo
                    </label>
                    <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um cargo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cargoOptions.map(cargo => (
                          <SelectItem key={cargo.value} value={cargo.value}>
                            {cargo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Buscar Material
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite o título, disciplina..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Materiais */}
            <div className="grid gap-6">
              {filteredMaterials.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Nenhum material encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedCargo !== 'all'
                        ? `Não há materiais disponíveis para ${cargoOptions.find(c => c.value === selectedCargo)?.label}`
                        : 'Tente ajustar os filtros de busca'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
                            onClick={() => handleMaterialClick(material)}>
                        <CardHeader className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-blue-600 dark:text-blue-400 line-clamp-2">
                                {material.title}
                              </CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                                {material.description}
                              </p>
                            </div>
                            <div className="ml-2">
                              {material.file_type === 'pdf' ? (
                                <FileText className="w-8 h-8 text-red-500" />
                              ) : (
                                <Eye className="w-8 h-8 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-end">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge className={typeColors[material.type]}>
                                {typeNames[material.type]}
                              </Badge>
                              <Badge variant="outline">
                                {subjectNames[material.subject]}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">
                                {cargoOptions.find(c => c.value === material.cargo)?.label}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-xs text-gray-400 truncate w-2/5">
                                {material.file_name}
                              </span>
                              <div className="flex items-center gap-2">
                                 {isAdmin && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => handleDeleteMaterial(e, material.id)}
                                    title="Excluir Material (Admin)"
                                  >
                                    <Trash2 className="w-4 h-4"/>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMaterialClick(material);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Artigos de Estudo</h2>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <Select value={selectedArticleSubject} onValueChange={(value) => {
                  setSelectedArticleSubject(value);
                  setCurrentArticlePage(1);
                }}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filtrar por disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Disciplinas</SelectItem>
                    {Object.entries(subjectNames).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={articleSearchTerm}
                    onChange={(e) => {
                      setArticleSearchTerm(e.target.value);
                      setCurrentArticlePage(1);
                    }}
                    placeholder="Buscar artigos por título, assunto..."
                    className="pl-10"
                  />
                </div>
                
                <Badge variant="secondary" className="text-sm">
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'artigo' : 'artigos'}
                </Badge>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Nenhum artigo disponível {selectedArticleSubject !== 'all' ? 'para esta disciplina' : 'no momento'}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col"
                        onClick={() => handleArticleClick(article)}
                      >
                        {article.cover_image_url && (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="flex-grow p-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                              {subjectNames[article.subject] || article.subject}
                            </Badge>
                            {article.topic && (
                              <Badge variant="outline" className="text-xs">
                                {article.topic}
                              </Badge>
                            )}
                            {article.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                ⭐
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm line-clamp-2">
                            {article.title}
                          </CardTitle>
                          {article.summary && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {article.summary}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            {article.reading_time && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {article.reading_time} min
                              </span>
                            )}
                            {article.views_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {article.views_count}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalArticlePages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentArticlePage(prev => Math.max(1, prev - 1))}
                      disabled={currentArticlePage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalArticlePages) }, (_, i) => {
                        let pageNum;
                        if (totalArticlePages <= 5) {
                          pageNum = i + 1;
                        } else if (currentArticlePage <= 3) {
                          pageNum = i + 1;
                        } else if (currentArticlePage >= totalArticlePages - 2) {
                          pageNum = totalArticlePages - 4 + i;
                        } else {
                          pageNum = currentArticlePage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={i}
                            variant={currentArticlePage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentArticlePage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentArticlePage(prev => Math.min(totalArticlePages, prev + 1))}
                      disabled={currentArticlePage === totalArticlePages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Página {currentArticlePage} de {totalArticlePages} • Mostrando {indexOfFirstArticle + 1}-{Math.min(indexOfLastArticle, filteredArticles.length)} de {filteredArticles.length} artigos
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Vídeo-Aulas</h2>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <Select value={selectedVideoSubject} onValueChange={(value) => {
                  setSelectedVideoSubject(value);
                  setCurrentVideoPage(1); // Reset page on filter change
                }}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filtrar por disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Disciplinas</SelectItem>
                    {Object.entries(subjectNames).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={videoSearchTerm}
                    onChange={(e) => {
                      setVideoSearchTerm(e.target.value);
                      setCurrentVideoPage(1);
                    }}
                    placeholder="Buscar vídeos por título, professor..."
                    className="pl-10"
                  />
                </div>
                
                <Badge variant="secondary" className="text-sm">
                  {filteredVideos.length} {filteredVideos.length === 1 ? 'vídeo' : 'vídeos'}
                </Badge>
              </div>
            </div>

            {filteredVideos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Play className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Nenhuma vídeo-aula disponível {selectedVideoSubject !== 'all' ? 'para esta disciplina' : 'no momento'}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {currentVideos.map((video, index) => {
                    const videoId = video.video_id || extractYouTubeId(video.youtube_url);
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    
                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer">
                          <div className="flex flex-col md:flex-row">
                            <div 
                              className="md:w-80 h-48 md:h-auto bg-gray-200 flex-shrink-0 relative group"
                              onClick={() => handlePlayVideo(video)}
                            >
                              <img
                                src={thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white rounded-full p-4">
                                  <Play className="w-8 h-8 text-red-600" />
                                </div>
                              </div>
                              {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                                  {video.duration}
                                </div>
                              )}
                            </div>

                            <CardContent className="flex-1 p-4">
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {subjectNames[video.subject] || video.subject}
                                </Badge>
                                {video.topic && (
                                  <Badge variant="outline">
                                    {video.topic}
                                  </Badge>
                                )}
                              </div>

                              <h3 
                                className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer line-clamp-2"
                                onClick={() => handlePlayVideo(video)}
                                style={{ fontWeight: 600 }}
                              >
                                {video.title}
                              </h3>

                              {video.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                  {video.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {video.instructor && (
                                  <span className="flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" />
                                    {video.instructor}
                                  </span>
                                )}
                                {video.duration && (
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {video.duration}
                                  </span>
                                )}
                              </div>

                              <Button
                                onClick={() => handlePlayVideo(video)}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                                size="sm"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Assistir Agora
                              </Button>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalVideoPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentVideoPage(prev => Math.max(1, prev - 1))}
                      disabled={currentVideoPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalVideoPages) }, (_, i) => {
                        let pageNum;
                        if (totalVideoPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentVideoPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentVideoPage >= totalVideoPages - 2) {
                          pageNum = totalVideoPages - 4 + i;
                        } else {
                          pageNum = currentVideoPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={i}
                            variant={currentVideoPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentVideoPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentVideoPage(prev => Math.min(totalVideoPages, prev + 1))}
                      disabled={currentVideoPage === totalVideoPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Página {currentVideoPage} de {totalVideoPages} • Mostrando {indexOfFirstVideo + 1}-{Math.min(indexOfLastVideo, filteredVideos.length)} de {filteredVideos.length} vídeos
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="mt-6">
              {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total de Cartões</p>
                      <p className="text-2xl font-bold">{flashcardStats.totalCards}</p>
                    </div>
                    <BookOpen className="w-8 h-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Para Revisar</p>
                      <p className="text-2xl font-bold">{flashcardStats.cardsDue}</p>
                    </div>
                    <Timer className="w-8 h-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Revisados Hoje</p>
                      <p className="text-2xl font-bold">{flashcardStats.reviewedToday}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Facilidade Média</p>
                      <p className="text-2xl font-bold">{flashcardStats.avgEasiness}</p>
                    </div>
                    <Brain className="w-8 h-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="review" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="review" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Revisar ({flashcardStats.cardsDue})
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Criar
                </TabsTrigger>
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Biblioteca
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Estatísticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="review" className="mt-6">
                <FlashcardReviewer
                  cardsDue={cardsDueToday}
                  onReviewComplete={loadAllData}
                />
              </TabsContent>
              <TabsContent value="create" className="mt-6">
                <FlashcardCreator onFlashcardCreated={loadAllData} />
              </TabsContent>
              <TabsContent value="library" className="mt-6">
                <FlashcardLibrary
                  flashcards={flashcards}
                  onUpdate={loadAllData}
                />
              </TabsContent>
              <TabsContent value="stats" className="mt-6">
                <FlashcardStats
                  flashcards={flashcards}
                  reviews={reviews}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        
        {/* Viewer Modal */}
        {selectedMaterial && (
          <StudyMaterialViewer
            material={selectedMaterial}
            isOpen={!!selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
          />
        )}

        {/* Modal do Player de Vídeo com Anotações */}
        {playingVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-7xl h-[90vh] flex flex-col">
              {/* Header do Player */}
              <div className="flex justify-between items-start mb-4 flex-shrink-0">
                <div className="text-white flex-1">
                  <h2 className="text-2xl font-bold mb-2">{playingVideo.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600">
                      {subjectNames[playingVideo.subject] || playingVideo.subject}
                    </Badge>
                    {playingVideo.topic && (
                      <Badge variant="outline" className="text-white border-white">
                        {playingVideo.topic}
                      </Badge>
                    )}
                    {playingVideo.instructor && (
                      <span className="text-sm text-gray-300">
                        Professor: {playingVideo.instructor}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseVideo}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Conteúdo Principal: Vídeo + Anotações */}
              <div className="flex-1 flex gap-4 min-h-0">
                {/* Player de Vídeo */}
                <div className="flex-1 flex flex-col">
                  <div className="relative w-full flex-1 bg-black rounded-lg overflow-hidden">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${playingVideo.video_id || extractYouTubeId(playingVideo.youtube_url)}?autoplay=1`}
                      title={playingVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Botões de Navegação */}
                  <div className="flex justify-between items-center mt-4 gap-2">
                    <Button
                      onClick={handlePreviousVideo}
                      disabled={filteredVideos.findIndex(v => v.id === playingVideo.id) === 0}
                      variant="outline"
                      className="text-white border-white hover:bg-white/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Vídeo Anterior
                    </Button>
                    
                    <Button
                      onClick={handleCloseVideo}
                      variant="outline"
                      className="text-white border-white hover:bg-white/20"
                    >
                      Voltar à Lista
                    </Button>
                    
                    <Button
                      onClick={handleNextVideo}
                      disabled={filteredVideos.findIndex(v => v.id === playingVideo.id) === filteredVideos.length - 1}
                      variant="outline"
                      className="text-white border-white hover:bg-white/20"
                    >
                      Próximo Vídeo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {playingVideo.description && (
                    <div className="mt-4 text-white bg-white/10 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Sobre esta aula:</h3>
                      <p className="text-gray-300">{playingVideo.description}</p>
                    </div>
                  )}
                </div>

                {/* Área de Anotações */}
                <div className="w-96 flex flex-col bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Minhas Anotações
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        onClick={handleSaveNotes}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        title="Salvar"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleDownloadNotes}
                        size="sm"
                        variant="outline"
                        className="text-white border-white hover:bg-white/20"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handlePrintNotes}
                        size="sm"
                        variant="outline"
                        className="text-white border-white hover:bg-white/20"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={videoNotes}
                    onChange={(e) => setVideoNotes(e.target.value)}
                    placeholder="Faça suas anotações sobre este vídeo aqui..."
                    className="flex-1 bg-white/90 text-gray-900 resize-none"
                    rows={20}
                  />
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Suas anotações são salvas automaticamente no seu navegador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal do Artigo com Modo Escuro */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className={`rounded-lg shadow-xl max-w-4xl w-full my-8 ${articleDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
              <div className={`flex justify-between items-start p-6 border-b ${articleDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-2 ${articleDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedArticle.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      {subjectNames[selectedArticle.subject] || selectedArticle.subject}
                    </Badge>
                    {selectedArticle.topic && (
                      <Badge variant="outline">
                        {selectedArticle.topic}
                      </Badge>
                    )}
                    {selectedArticle.author && (
                      <span className={`text-sm ${articleDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Por: {selectedArticle.author}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setArticleDarkMode(!articleDarkMode)}
                    size="icon"
                    variant="ghost"
                    className={articleDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}
                    title={articleDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                  >
                    {articleDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </Button>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className={`p-2 ${articleDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div 
                  className={`prose max-w-none ${articleDarkMode ? 'prose-invert' : ''}`}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  style={articleDarkMode ? {
                    color: '#e5e7eb',
                  } : {}}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}