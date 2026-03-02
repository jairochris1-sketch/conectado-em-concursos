import { useState, useEffect } from 'react';
import { StudyMaterial, Flashcard, FlashcardReview, User, YouTubeVideo, Article } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Sun,
  Grid3x3,
  List,
  LayoutGrid,
  BookUser,
  ChevronRight,
  ChevronDown } from
'lucide-react';
import { motion } from 'framer-motion';

import StudyMaterialViewer from '../components/studies/StudyMaterialViewer';
import StudyMaterialUploader from '../components/studies/StudyMaterialUploader';
import FlashcardCreator from '../components/flashcards/FlashcardCreator';
import FlashcardReviewer from '../components/flashcards/FlashcardReviewer';
import FlashcardStats from '../components/flashcards/FlashcardStats';
import FlashcardLibrary from '../components/flashcards/FlashcardLibrary';
import EnhancedArticleReader from '../components/reading/EnhancedArticleReader';
import CommunityPage from './Community';

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
{ value: "analista_bancario", label: "Analista Bancário" }];


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
  // Course State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseTab, setCourseTab] = useState('conteudo');
  const [contentSubTab, setContentSubTab] = useState('videoaula');
  const [contentSearch, setContentSearch] = useState('');
  const [forumSubTab, setForumSubTab] = useState('videoaula');
  const [forumFilter, setForumFilter] = useState('todas');
  const [forumScope, setForumScope] = useState('todas_perguntas');
  const [forumSearch, setForumSearch] = useState('');

  // State for Study Materials
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [materialViewMode, setMaterialViewMode] = useState(() => {
    return localStorage.getItem('materialViewMode') || 'grid';
  });

  // New Windows 11 Explorer-style navigation
  const [navigationPath, setNavigationPath] = useState(['Meus Cursos']);
  const [currentView, setCurrentView] = useState('root'); // 'root', 'subject', 'type'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

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
  const [videoPlayerSize, setVideoPlayerSize] = useState(() => {
    return localStorage.getItem('videoPlayerSize') || 'normal';
  }); // normal, medium, large
  const [showNotes, setShowNotes] = useState(true); // State to toggle notes panel
  const [videoDisplaySize, setVideoDisplaySize] = useState(() => {
    return localStorage.getItem('videoDisplaySize') || 'normal';
  }); // small, normal, large - for video card thumbnails

  // Paginação de vídeos
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const videosPerPage = 40;

  // State for Articles
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedArticleSubject, setSelectedArticleSubject] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleDarkMode, setArticleDarkMode] = useState(false); // New state for article dark mode
  const [articleViewMode, setArticleViewMode] = useState(() => {
    return localStorage.getItem('articleViewMode') || 'grid';
  });

  // New state for search
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [videoSearchTerm, setVideoSearchTerm] = useState('');

  // NEW: Article pagination state
  const [currentArticlePage, setCurrentArticlePage] = useState(1);
  const articlesPerPage = 20;

  useEffect(() => {
    localStorage.setItem('materialViewMode', materialViewMode);
  }, [materialViewMode]);

  useEffect(() => {
    localStorage.setItem('articleViewMode', articleViewMode);
  }, [articleViewMode]);

  useEffect(() => {
    localStorage.setItem('videoPlayerSize', videoPlayerSize);
  }, [videoPlayerSize]);

  useEffect(() => {
    localStorage.setItem('videoDisplaySize', videoDisplaySize);
  }, [videoDisplaySize]);

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
      Article.filter({ is_published: true }, 'created_date')]
      );

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
      setArticles(articlesData.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setFilteredArticles(articlesData.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      const dueCards = flashcardsData.filter((card) => {
        // Find the latest review for this card
        const latestReview = reviewsData.
        filter((r) => r.flashcard_id === card.id).
        sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];

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

    // Check URL parameters for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'english') {

      // Tab will be handled by Tabs component defaultValue
    }}, []);

  useEffect(() => {
    const filterMaterials = () => {
      let filtered = [...materials];

      if (selectedCargo !== 'all') {
        filtered = filtered.filter((material) => material.cargo === selectedCargo);
      }

      if (selectedSubject) {
        filtered = filtered.filter((material) => material.subject === selectedSubject);
      }

      if (selectedType) {
        filtered = filtered.filter((material) => material.type === selectedType);
      }

      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter((material) =>
        material.title?.toLowerCase().includes(search) ||
        material.description?.toLowerCase().includes(search) ||
        subjectNames[material.subject]?.toLowerCase().includes(search)
        );
      }

      setFilteredMaterials(filtered);
    };

    filterMaterials();
  }, [materials, selectedCargo, selectedSubject, selectedType, searchTerm]);

  // Navigation handlers
  const handleNavigateToSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedType(null);
    setCurrentView('subject');
    setNavigationPath(['Meus Cursos', subjectNames[subject]]);
  };

  const handleNavigateToType = (type) => {
    setSelectedType(type);
    setSelectedSubject(null);
    setCurrentView('type');
    setNavigationPath(['Meus Cursos', typeNames[type]]);
  };

  const handleNavigateToRoot = () => {
    setSelectedSubject(null);
    setSelectedType(null);
    setCurrentView('root');
    setNavigationPath(['Meus Cursos']);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === 0) {
      handleNavigateToRoot();
    }
  };

  // Get unique subjects and types from materials
  const availableSubjects = [...new Set(materials.map((m) => m.subject))].filter(Boolean);
  const availableTypes = [...new Set(materials.map((m) => m.type))].filter(Boolean);

  useEffect(() => {
    let filtered = [...articles];

    if (selectedArticleSubject !== 'all') {
      filtered = filtered.filter((article) => article.subject === selectedArticleSubject);
    }

    if (articleSearchTerm.trim()) {
      const search = articleSearchTerm.toLowerCase();
      filtered = filtered.filter((article) =>
      article.title.toLowerCase().includes(search) ||
      article.summary?.toLowerCase().includes(search) ||
      article.topic?.toLowerCase().includes(search)
      );
    }

    setFilteredArticles(filtered.sort((a, b) =>
    new Date(a.created_date) - new Date(b.created_date)
    ));
  }, [selectedArticleSubject, articles, articleSearchTerm]);

  useEffect(() => {
    let filtered = [...videos];

    if (selectedVideoSubject !== 'all') {
      filtered = filtered.filter((video) => video.subject === selectedVideoSubject);
    }

    if (videoSearchTerm.trim()) {
      const search = videoSearchTerm.toLowerCase();
      filtered = filtered.filter((video) =>
      video.title?.toLowerCase().includes(search) ||
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

    const reviewedTodayCount = reviews.filter((r) => {
      const reviewDate = new Date(r.created_date);
      return reviewDate >= today && reviewDate < tomorrow;
    }).length;

    // Calculate average easiness factor from all reviews
    const avgEasiness = reviews.length > 0 ?
    reviews.reduce((sum, r) => sum + (r.easiness_factor || 2.5), 0) / reviews.length :
    2.5;

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
    if (window.confirm("Tem certeza que deseja excluir este material de estudo? Esta ação não pode ser desfeita.")) {
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
    return match && match[2].length === 11 ? match[2] : null;
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

    const currentIndex = filteredVideos.findIndex((v) => v.id === playingVideo.id);
    if (currentIndex > 0) {
      const previousVideo = filteredVideos[currentIndex - 1];
      handlePlayVideo(previousVideo);
    }
  };

  const handleNextVideo = () => {
    if (!playingVideo) return;

    // Salvar anotações do vídeo atual
    localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);

    const currentIndex = filteredVideos.findIndex((v) => v.id === playingVideo.id);
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
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando seus cursos...</p>
          </div>
        </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <BookUser className="w-8 h-8" /> Meus Cursos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Seus materiais, resumos e videoaulas organizados por curso.
            </p>
          </div>
          {isAdmin &&
          <Button
            onClick={() => setShowUploader(!showUploader)}
            className="bg-indigo-600 hover:bg-indigo-700">

              <Upload className="w-4 h-4 mr-2" />
              Adicionar Material
            </Button>
          }
        </motion.div>

        {!selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cargoOptions.filter(c => c.value !== 'all' && c.value !== 'materiais_questoes').map(cargo => (
              <Card key={cargo.value} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={() => {
                  setSelectedCourse(cargo);
                  setSelectedCargo(cargo.value);
              }}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-300">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{cargo.label}</h3>
                  <p className="text-sm text-gray-500 mt-2">Acessar conteúdo do curso</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 px-6 pt-6 pb-2">
               <Button variant="ghost" onClick={() => {
                   setSelectedCourse(null);
                   setSelectedCargo('all');
               }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white -ml-4">
                 <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
               </Button>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCourse.label}</h2>
            </div>
            
            <Tabs value={courseTab} onValueChange={setCourseTab} className="w-full">
              <TabsList className="flex border-b border-gray-200 dark:border-gray-800 bg-transparent h-auto p-0 px-6 space-x-8 rounded-none overflow-x-auto justify-start">
                <TabsTrigger value="painel" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Painel
                </TabsTrigger>
                <TabsTrigger value="conteudo" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger value="cronograma" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Cronograma
                </TabsTrigger>
                <TabsTrigger value="forum" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Fórum de dúvidas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="painel" className="p-6 min-h-[400px]">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center h-64">
                   <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Painel de Estatísticas</h3>
                   <p className="text-gray-500 dark:text-gray-400 max-w-md">O progresso e as estatísticas do seu curso estarão disponíveis em breve nesta seção.</p>
                </div>
              </TabsContent>

              <TabsContent value="cronograma" className="p-6 min-h-[400px]">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center h-64">
                   <Timer className="w-12 h-12 text-gray-400 mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Cronograma</h3>
                   <p className="text-gray-500 dark:text-gray-400 max-w-md">O cronograma focado neste curso será disponibilizado em breve.</p>
                </div>
              </TabsContent>

              <TabsContent value="forum" className="mt-0 min-h-[500px]">
                <div className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-6 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setForumSubTab('videoaula')} className={`flex items-center gap-2 pb-3 -mb-[13px] border-b-2 text-sm font-medium ${forumSubTab === 'videoaula' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        <Play className="w-4 h-4" fill={forumSubTab === 'videoaula' ? 'currentColor' : 'none'} /> Videoaula
                      </button>
                      <button onClick={() => setForumSubTab('pdf')} className={`flex items-center gap-2 pb-3 -mb-[13px] border-b-2 text-sm font-medium ${forumSubTab === 'pdf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        PDF
                      </button>
                    </div>
                    
                    <div className="sm:ml-auto w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input 
                          placeholder="Filtrar por disciplina ou professor(a)" 
                          value={forumSearch}
                          onChange={(e) => setForumSearch(e.target.value)}
                          className="pl-9 h-9 w-full sm:w-[300px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-1"
                        />
                      </div>
                      <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shrink-0">
                        Fazer uma pergunta <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Visualizar por:</span>
                      <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <button onClick={() => setForumFilter('todas')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${forumFilter === 'todas' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Todas</button>
                        <button onClick={() => setForumFilter('respondidas')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${forumFilter === 'respondidas' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Respondidas</button>
                        <button onClick={() => setForumFilter('nao_respondidas')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${forumFilter === 'nao_respondidas' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Não respondidas</button>
                      </div>
                    </div>
                    
                    <div className="flex bg-gray-50 dark:bg-gray-800 rounded-full p-1 self-stretch md:self-auto">
                      <button onClick={() => setForumScope('todas_perguntas')} className={`px-4 py-1.5 text-xs sm:text-sm rounded-full transition-colors flex-1 ${forumScope === 'todas_perguntas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Todas as perguntas</button>
                      <button onClick={() => setForumScope('minhas_perguntas')} className={`px-4 py-1.5 text-xs sm:text-sm rounded-full transition-colors flex-1 ${forumScope === 'minhas_perguntas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Minhas perguntas</button>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-8 space-y-1 mt-2">
                    {Object.values(subjectNames).slice(0, 5).map((subject) => (
                      <div key={subject} className="border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 border-b">
                        <button className="w-full flex items-center justify-between px-2 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{subject}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="conteudo" className="p-6">
                <div className="space-y-6">
                  {/* Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setContentSubTab('videoaula')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${contentSubTab === 'videoaula' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                      <Play className="w-4 h-4" fill={contentSubTab === 'videoaula' ? 'currentColor' : 'none'} />
                      Videoaula
                    </button>
                    <button onClick={() => setContentSubTab('pdf')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${contentSubTab === 'pdf' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                      PDF
                    </button>
                    <button onClick={() => setContentSubTab('outros')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${contentSubTab === 'outros' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                      Outros materiais
                    </button>
                    <button onClick={() => setContentSubTab('notificacoes')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${contentSubTab === 'notificacoes' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                      Notificações
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input 
                        placeholder="Pesquisar" 
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="pl-9 h-10 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                        Disciplinas <ChevronDown className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                        Professores <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Content List */}
                  <div className="mt-6">
                    {contentSubTab === 'videoaula' && (
                      <Accordion type="multiple" className="w-full space-y-3">
                        {Object.entries(
                          filteredVideos.filter(v => !contentSearch.trim() || v.title?.toLowerCase().includes(contentSearch.toLowerCase()) || v.instructor?.toLowerCase().includes(contentSearch.toLowerCase()))
                          .reduce((acc, v) => {
                            const subj = subjectNames[v.subject] || v.subject || 'Outros';
                            if (!acc[subj]) acc[subj] = [];
                            acc[subj].push(v);
                            return acc;
                          }, {})
                        ).map(([subject, subjectVideos], idx) => (
                          <AccordionItem key={idx} value={`subject-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-semibold text-gray-900 dark:text-white text-base">{subject}</span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 pb-0.5">
                                  {Math.floor(Math.random() * 80) + 10}% concluído
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0 pb-4 px-5">
                               <div className="space-y-2 mt-2">
                                 {subjectVideos.map(video => (
                                    <div key={video.id} onClick={() => handlePlayVideo(video)} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all group">
                                       <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                           <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                         </div>
                                         <div>
                                           <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{video.title}</p>
                                           <div className="flex items-center gap-3 mt-1">
                                             {video.duration && <p className="text-xs text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3" /> {video.duration}</p>}
                                             {video.instructor && <p className="text-xs text-gray-500 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Prof. {video.instructor}</p>}
                                           </div>
                                         </div>
                                       </div>
                                    </div>
                                 ))}
                               </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                    
                    {contentSubTab === 'pdf' && (
                      <Accordion type="multiple" className="w-full space-y-3">
                        {Object.entries(
                          filteredMaterials.filter(m => (m.file_type === 'pdf' || m.type === 'resumo') && (!contentSearch.trim() || m.title?.toLowerCase().includes(contentSearch.toLowerCase())))
                          .reduce((acc, m) => {
                            const subj = subjectNames[m.subject] || m.subject || 'Outros';
                            if (!acc[subj]) acc[subj] = [];
                            acc[subj].push(m);
                            return acc;
                          }, {})
                        ).map(([subject, subjectItems], idx) => (
                          <AccordionItem key={idx} value={`subject-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-semibold text-gray-900 dark:text-white text-base">{subject}</span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 pb-0.5">
                                  {Math.floor(Math.random() * 80) + 10}% concluído
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0 pb-4 px-5">
                               <div className="space-y-2 mt-2">
                                 {subjectItems.map(item => (
                                    <div key={item.id} onClick={() => handleMaterialClick(item)} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/20 cursor-pointer transition-all group">
                                       <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors flex-shrink-0">
                                           <FileText className="w-4 h-4" />
                                         </div>
                                         <div>
                                           <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.title}</p>
                                           {item.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>}
                                         </div>
                                       </div>
                                    </div>
                                 ))}
                               </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}

                    {contentSubTab === 'outros' && (
                      <Accordion type="multiple" className="w-full space-y-3">
                        {Object.entries(
                          filteredMaterials.filter(m => m.file_type !== 'pdf' && m.type !== 'resumo' && (!contentSearch.trim() || m.title?.toLowerCase().includes(contentSearch.toLowerCase())))
                          .reduce((acc, m) => {
                            const subj = subjectNames[m.subject] || m.subject || 'Outros';
                            if (!acc[subj]) acc[subj] = [];
                            acc[subj].push(m);
                            return acc;
                          }, {})
                        ).map(([subject, subjectItems], idx) => (
                          <AccordionItem key={idx} value={`subject-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-semibold text-gray-900 dark:text-white text-base">{subject}</span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 pb-0.5">
                                  {Math.floor(Math.random() * 80) + 10}% concluído
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0 pb-4 px-5">
                               <div className="space-y-2 mt-2">
                                 {subjectItems.map(item => (
                                    <div key={item.id} onClick={() => handleMaterialClick(item)} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all group">
                                       <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-gray-600 group-hover:text-white transition-colors flex-shrink-0">
                                           <BookOpen className="w-4 h-4" />
                                         </div>
                                         <div>
                                           <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{item.title}</p>
                                           {item.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>}
                                         </div>
                                       </div>
                                    </div>
                                 ))}
                               </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}

                    {contentSubTab === 'notificacoes' && (
                      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma notificação no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Viewer Modal */}
        {selectedMaterial &&
        <StudyMaterialViewer
          material={selectedMaterial}
          isOpen={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)} />

        }

        {/* Modal do Player de Vídeo em formato Playlist */}
        {playingVideo &&
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            {/* Video Player Section */}
            <div className="flex-1 flex flex-col lg:flex-row h-full">
              {/* Main Video Player */}
              <div className={`flex flex-col bg-black ${
            videoPlayerSize === 'large' ? 'flex-[2]' :
            videoPlayerSize === 'medium' ? 'flex-[1.5]' :
            'flex-1'}`
            }>
                <div className="flex-1 relative">
                   <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideo.video_id || extractYouTubeId(playingVideo.youtube_url)}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />

                 </div>

                {/* Bottom Bar with Title and Navigation */}
                <div className="bg-gray-800 px-3 md:px-6 py-2 md:py-4 border-t border-gray-700">
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white text-sm md:text-lg font-semibold mb-1 line-clamp-2">{playingVideo.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-400">
                        {playingVideo.instructor &&
                      <span className="truncate">Prof. {playingVideo.instructor}</span>
                      }
                        {playingVideo.topic &&
                      <span className="hidden md:inline">• {playingVideo.topic}</span>
                      }
                      </div>
                    </div>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseVideo}
                    className="text-gray-400 hover:text-white">

                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {playingVideo.description &&
                <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3 line-clamp-1 md:line-clamp-2">{playingVideo.description}</p>
                }
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousVideo}
                      disabled={filteredVideos.findIndex((v) => v.id === playingVideo.id) === 0}
                      className="text-white border-gray-600 hover:bg-gray-700 disabled:opacity-50 text-xs h-7 px-2">

                        ← Anterior
                      </Button>
                      <Button
                      variant="default"
                      size="sm"
                      onClick={handleNextVideo}
                      disabled={filteredVideos.findIndex((v) => v.id === playingVideo.id) === filteredVideos.length - 1}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs h-7 px-2">

                        Próximo →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playlist Sidebar with Notes */}
              <aside className={`${showNotes ? 'w-full lg:w-96' : 'w-12'} bg-gray-900 border-l border-gray-800 flex flex-col max-h-screen transition-all`}>
                <div className="sticky top-0 bg-gray-800 px-4 py-3 border-b border-gray-700 z-10 flex items-center justify-between">
                  {showNotes ?
                <>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Playlist do Curso</h3>
                        <p className="text-gray-400 text-sm">
                          {subjectNames[playingVideo.subject] || playingVideo.subject}
                        </p>
                      </div>
                      <Button
                    onClick={() => setShowNotes(false)}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    title="Fechar painel">

                        <X className="w-4 h-4" />
                      </Button>
                    </> :

                <Button
                  onClick={() => setShowNotes(true)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white w-full"
                  title="Abrir painel">

                      <BookOpen className="w-4 h-4" />
                    </Button>
                }
                </div>

                {showNotes &&
              <>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-2">
                        {filteredVideos.map((video, idx) => {
                      const videoId = video.video_id || extractYouTubeId(video.youtube_url);
                      const isActive = video.id === playingVideo.id;
                      return (
                        <button
                          key={video.id}
                          onClick={() => {
                            localStorage.setItem(`video_notes_${playingVideo.id}`, videoNotes);
                            handlePlayVideo(video);
                          }}
                          className={`w-full text-left p-3 mb-2 rounded-lg transition-all ${
                          isActive ?
                          'bg-blue-600 text-white' :
                          'bg-gray-800 text-gray-300 hover:bg-gray-700'}`
                          }>

                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isActive ? 'bg-white text-blue-600' : 'bg-gray-700 text-gray-400'}`
                            }>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-sm mb-1 line-clamp-2 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                    {video.title}
                                  </div>
                                  {video.duration &&
                              <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                                      {video.duration}
                                    </div>
                              }
                                </div>
                              </div>
                            </button>);

                    })}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="border-t border-gray-800 bg-gray-800 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Minhas Anotações
                        </h4>
                        <div className="flex gap-1">
                          <Button
                        onClick={handleDownloadNotes}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2"
                        title="Baixar">

                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <Textarea
                    value={videoNotes}
                    onChange={(e) => setVideoNotes(e.target.value)}
                    placeholder="Faça suas anotações sobre este vídeo aqui..."
                    className="bg-gray-900 text-white border-gray-700 resize-none text-sm"
                    rows={8} />


                      <p className="text-xs text-gray-500 mt-2">
                        Salvas automaticamente no navegador.
                      </p>
                    </div>
                  </>
              }
              </aside>
            </div>
          </div>
        }

        {/* Enhanced Article Reader */}
        <EnhancedArticleReader
          article={selectedArticle}
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)} />

      </div>
    </div>);

}