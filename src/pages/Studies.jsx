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
  Eye,
  RefreshCw,
  Upload,
  Download,
  BookUser,
  Briefcase,
  GraduationCap,
  Shield,
  Stethoscope,
  Cpu,
  Calculator,
  Building2,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import StudyMaterialViewer from '../components/studies/StudyMaterialViewer';
import StudyMaterialUploader from '../components/studies/StudyMaterialUploader';
import EnhancedArticleReader from '../components/reading/EnhancedArticleReader';

// Carreiras disponíveis
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

// Ícones genéricos e diferentes por carreira
const careerIcons = [Briefcase, GraduationCap, Shield, Stethoscope, Cpu, Calculator, Building2, ClipboardList];
const getCareerIcon = (index) => careerIcons[index % careerIcons.length];

// Removidos modos/abas antigos
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
  // Estado mínimo necessário
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        // usuário não autenticado
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handlers removidos: filtros, busca, abas, etc.
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
  const [navigationPath, setNavigationPath] = useState(['Áreas de Estudo']);
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
    }
  }, []);

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
        material.title.toLowerCase().includes(search) ||
        material.description?.toLowerCase().includes(search) ||
        subjectNames[material.subject]?.toLowerCase().includes(search)
        );
      }

      setFilteredMaterials(filtered);
    };

    filterMaterials();
  }, [materials, selectedCargo, selectedSubject, selectedType, searchTerm]);

  // Navigation handlers
  const handleNavigateToCargo = (cargoValue, cargoLabel) => {
    setSelectedCargo(cargoValue);
    setSelectedSubject(null);
    setSelectedType(null);
    setCurrentView('root');
    setNavigationPath(['Áreas de Estudo', cargoLabel]);
  };
  const handleNavigateToSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedType(null);
    setCurrentView('subject');
    setNavigationPath(['Áreas de Estudo', subjectNames[subject]]);
  };

  const handleNavigateToType = (type) => {
    setSelectedType(type);
    setSelectedSubject(null);
    setCurrentView('type');
    setNavigationPath(['Áreas de Estudo', typeNames[type]]);
  };

  const handleNavigateToRoot = () => {
    setSelectedSubject(null);
    setSelectedType(null);
    setCurrentView('root');
    setNavigationPath(['Áreas de Estudo']);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === 0) {
      handleNavigateToRoot();
    }
  };

  // Get unique subjects and types from materials
  const availableSubjects = [...new Set(materials.map(m => m.subject))].filter(Boolean);
  const availableTypes = [...new Set(materials.map(m => m.type))].filter(Boolean);

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
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando Áreas de Estudo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <BookUser className="w-8 h-8" /> Áreas de Estudo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha uma carreira para acessar os materiais e conteúdos do curso.
            </p>
          </div>
        </motion.div>

        {/* Pastas de Materiais Personalizadas */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pastas de Materiais Personalizadas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Organize seus próprios materiais por pasta. Em breve você poderá criar e gerenciar essas pastas aqui.
          </p>
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Você ainda não criou nenhuma pasta.</p>
            <p className="text-sm text-gray-500">Crie uma pasta para organizar seus próprios materiais.</p>
          </div>
        </div>

        {/* Grid de Carreiras */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Áreas de Estudo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cargoOptions
              .filter(c => c.value !== 'all' && c.value !== 'materiais_questoes')
              .map((cargo, idx) => {
                const Icon = getCareerIcon(idx);
                return (
                  <motion.div
                    key={cargo.value}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                  >
                    <Link to={createPageUrl('Course') + `?cargo=${cargo.value}`} className="block">
                      <Card className="hover:shadow-lg transition-shadow h-full">
                        <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <Icon className="w-7 h-7 text-gray-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{cargo.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Acessar conteúdo do curso</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </div>
        {/* Fim do conteúdo simplificado */}

        {/* Removido: viewer e player antigos */}
        {false && selectedMaterial &&
        <StudyMaterialViewer
          material={selectedMaterial}
          isOpen={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)} />

        }

        {/* Modal do Player de Vídeo em formato Playlist */}
        {false &&
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
        {false && (
          <EnhancedArticleReader
            article={selectedArticle}
            isOpen={!!selectedArticle}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </div>
    </div>);

}