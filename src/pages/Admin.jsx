import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Question } from '@/entities/Question';
import { Topic } from '@/entities/Topic';
import { SiteContent } from '@/entities/SiteContent';
import { FAQ } from '@/entities/FAQ';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PlusCircle, Shield, AlertTriangle, Loader2, Pencil, FileText, Download, Upload, HelpCircle, CreditCard, Zap, BookOpen, Plus, Play, Newspaper, Bookmark, Users } from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// Direct imports for components
import ModernQuestionForm from '../components/admin/ModernQuestionForm';
import QuestionImporter from '../components/admin/QuestionImporter';
import AdminContentForm from '../components/admin/AdminContentForm';
import AdminFAQForm from '../components/admin/AdminFAQForm';
import TopicManager from '../components/admin/TopicManager';
import NotificationManager from '../components/admin/NotificationManager';
import ArticleManager from '../components/admin/ArticleManager';
import GuideManager from '../components/admin/GuideManager';
import UserManager from '../components/admin/UserManager';
import FeedbackManager from '../components/admin/FeedbackManager';
import QuestionsList from '../components/admin/QuestionsList';
import ProvasEnviadasList from '../components/admin/ProvasEnviadasList';
import SubscriptionsList from '../components/admin/SubscriptionsList';
import VideoManager from '../components/admin/VideoManager';

// Mapeamento completo de disciplinas
const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  raciocinio_logico: "Raciocínio Lógico",
  informatica: "Informática",
  tecnologia_informacao: "Tecnologia da Informação",
  conhecimentos_gerais: "Conhecimentos Gerais",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  direito_tributario: "Direito Tributário",
  direito_previdenciario: "Direito Previdenciário",
  direito_eleitoral: "Direito Eleitoral",
  direito_ambiental: "Direito Ambiental",
  direito_trabalho: "Direito do Trabalho",
  direito_processual_penal: "Direito Processual Penal",
  administracao_geral: "Administração Geral",
  administracao_publica: "Administração Pública",
  afo: "AFO",
  gestao_pessoas: "Gestão de Pessoas",
  administracao_recursos_materiais: "Administração de Recursos Materiais",
  arquivologia: "Arquivologia",
  financas_publicas: "Finanças Públicas",
  etica_administracao: "Ética na Administração",
  atendimento_publico: "Atendimento ao Público",
  comunicacao_social: "Comunicação Social",
  direitos_humanos: "Direitos Humanos",
  eca: "ECA",
  contabilidade: "Contabilidade",
  economia: "Economia",
  estatistica: "Estatística",
  pedagogia: "Pedagogia",
  educacao_fisica: "Educação Física",
  ingles: "Inglês",
  seguranca_publica: "Segurança Pública",
  lei_8112: "Lei 8.112/90",
  lei_8666: "Lei 8.666/93",
  lei_14133: "Lei 14.133/21",
  constituicao_federal: "Constituição Federal",
  regimento_interno: "Regimento Interno",
  legislacao_especifica: "Legislação Específica",
  legislacao_estadual: "Legislação Estadual",
  legislacao_municipal: "Legislação Municipal"
};

// Mapeamento completo de instituições
const institutionNames = {
  fcc: "FCC",
  cespe: "CESPE/CEBRASPE", 
  vunesp: "VUNESP",
  fgv: "FGV",
  cesgranrio: "CESGRANRIO",
  esaf: "ESAF",
  fundatec: "FUNDATEC",
  consulplan: "CONSULPLAN",
  idecan: "IDECAN",
  aocp: "AOCP",
  quadrix: "QUADRIX",
  instituto_aocp: "Instituto AOCP",
  planejar: "PLANEJAR",
  ibptec: "IBPTEC",
  amiga_publica: "AMIGA PÚBLICA",
  ibade: "IBADE",
  ibfc: "IBFC",
  objetiva: "Objetiva",
  iades: "IADES",
  itame: "ITAME",
  outras: "Outras"
};

// Arrays estáticos baseados no schema
const STATIC_SUBJECTS = [
  'portugues', 'matematica', 'raciocinio_logico', 'informatica', 'tecnologia_informacao',
  'conhecimentos_gerais', 'direito_constitucional', 'direito_administrativo', 'direito_penal',
  'direito_civil', 'direito_tributario', 'direito_previdenciario', 'direito_eleitoral',
  'direito_ambiental', 'direito_trabalho', 'direito_processual_penal', 'administracao_geral',
  'administracao_publica', 'afo', 'gestao_pessoas', 'administracao_recursos_materiais',
  'arquivologia', 'financas_publicas', 'etica_administracao', 'atendimento_publico',
  'comunicacao_social', 'direitos_humanos', 'eca', 'contabilidade', 'economia', 'estatistica',
  'pedagogia', 'educacao_fisica', 'ingles', 'seguranca_publica', 'lei_8112', 'lei_8666',
  'lei_14133', 'constituicao_federal', 'regimento_interno', 'legislacao_especifica',
  'legislacao_estadual', 'legislacao_municipal'
];

const STATIC_INSTITUTIONS = [
  'fcc', 'cespe', 'vunesp', 'fgv', 'cesgranrio', 'esaf', 'fundatec', 'consulplan',
  'idecan', 'aocp', 'quadrix', 'instituto_aocp', 'planejar', 'ibptec', 'amiga_publica',
  'ibade', 'ibfc', 'objetiva', 'iades', 'itame', 'outras'
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');

  const [welcomeContent, setWelcomeContent] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [editingFAQ, setEditingFAQ] = useState(null);
  
  // States for subjects and institutions - inicializados com valores estáticos
  const [allSubjects, setAllSubjects] = useState(() => {
    const subjects = STATIC_SUBJECTS.map(key => ({
      id: key,
      name: subjectNames[key] || key
    }));
    subjects.sort((a, b) => {
      if (a.name === 'Português') return -1;
      if (b.name === 'Português') return 1;
      return a.name.localeCompare(b.name);
    });
    return subjects;
  });
  
  const [allInstitutions, setAllInstitutions] = useState(() => {
    const institutions = STATIC_INSTITUTIONS.map(key => ({
      id: key,
      name: institutionNames[key] || key.toUpperCase()
    }));
    institutions.sort((a, b) => a.name.localeCompare(b.name));
    return institutions;
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com'];
        if (adminEmails.includes(user.email)) {
          setIsAdmin(true);
          loadQuestions();
          loadWelcomeContent();
          loadFAQs();
        } else {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        navigate(createPageUrl('Dashboard'));
      }
      setIsLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const loadQuestions = async () => {
    setIsDataLoading(true);
    try {
      const questionsData = await Question.list('-created_date');
      setQuestions(questionsData);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      toast.error('Erro ao carregar questões.');
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadWelcomeContent = async () => {
    try {
      const contentData = await SiteContent.filter({ page_key: 'welcome_page' });
      if (contentData && contentData.length > 0) {
        setWelcomeContent(contentData[0]);
      } else {
        setWelcomeContent({ page_key: 'welcome_page', content: '' });
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo do site:', error);
      toast.error('Erro ao carregar conteúdo do site.');
    }
  };

  const loadFAQs = async () => {
    try {
      const faqData = await FAQ.list('-created_date');
      setFaqs(faqData);
    } catch (error) {
      console.error('Erro ao carregar FAQs:', error);
      toast.error('Erro ao carregar FAQs.');
    }
  };

  const handleEditFAQ = (faq) => {
    setEditingFAQ(faq);
    setActiveTab('faq');
  };

  const handleDeleteFAQ = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este FAQ?')) {
      try {
        await FAQ.delete(id);
        toast.success('FAQ excluído com sucesso!');
        loadFAQs();
      } catch (error) {
        console.error('Erro ao deletar FAQ:', error);
        toast.error('Falha ao remover o FAQ. Tente novamente.');
      }
    }
  };

  const handleFAQSave = () => {
    setEditingFAQ(null);
    setActiveTab('faq-list');
    loadFAQs();
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab('new-question');
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Tem certeza que deseja remover esta questão?')) {
      try {
        await Question.delete(id);
        toast.success('Questão excluída com sucesso!');
        loadQuestions();
      } catch (error) {
        console.error('Erro ao deletar questão:', error);
        toast.error('Falha ao remover a questão. Tente novamente.');
      }
    }
  };

  const handleSaveQuestion = (message) => {
    toast.success(message);
    setSelectedQuestion(null);
    setActiveTab('questions');
    loadQuestions();
  };

  const handleContentSave = async (updatedContent) => {
    try {
      if (updatedContent.id) {
        await SiteContent.update(updatedContent.id, updatedContent);
      } else {
        await SiteContent.create(updatedContent);
      }
      toast.success('Conteúdo atualizado com sucesso!');
      loadWelcomeContent();
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      toast.error('Falha ao salvar o conteúdo.');
    }
  };

  const handleExport = async (format) => {
    const loadingToast = toast.loading('Exportando questões...');
    try {
      // Chamar a função backend
      const response = await base44.functions.invoke('exportQuestions', { format });
      
      // Verificar se a resposta é válida
      if (!response) {
        throw new Error('Resposta vazia do servidor');
      }

      // Criar blob a partir da resposta
      const blob = new Blob([response], { 
        type: format === 'xml' ? 'application/xml; charset=utf-8' : 'text/csv; charset=utf-8' 
      });
      
      // Download do arquivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conectadoemconcursos_questions_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 100);
      
      toast.dismiss(loadingToast);
      toast.success(`${format.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.dismiss(loadingToast);
      toast.error(`Erro ao exportar questões: ${error.message}`);
    }
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-12 md:grid-cols-12">
            <TabsTrigger value="users" className="flex-col gap-1 py-3">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="flex-col gap-1 py-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-xs">Feedbacks</span>
            </TabsTrigger>
            <TabsTrigger value="questions" onClick={() => setSelectedQuestion(null)} className="flex-col gap-1 py-3">
              <Pencil className="w-5 h-5 text-green-500" />
              <span className="text-xs">Questões</span>
            </TabsTrigger>
            <TabsTrigger value="new-question" className="flex-col gap-1 py-3">
              <PlusCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-xs">{selectedQuestion ? 'Editar' : 'Nova'}</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-col gap-1 py-3">
              <Upload className="w-5 h-5 text-purple-500" />
              <span className="text-xs">Importar</span>
            </TabsTrigger>
            <TabsTrigger value="provas" className="flex-col gap-1 py-3">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span className="text-xs">Provas</span>
            </TabsTrigger>
            <TabsTrigger value="assinaturas" className="flex-col gap-1 py-3">
              <CreditCard className="w-5 h-5 text-pink-500" />
              <span className="text-xs">Planos</span>
            </TabsTrigger>
            <TabsTrigger value="conteudo" className="flex-col gap-1 py-3">
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="text-xs">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-col gap-1 py-3">
              <Play className="w-5 h-5 text-red-500" />
              <span className="text-xs">Vídeos</span>
            </TabsTrigger>
            <TabsTrigger value="artigos" className="flex-col gap-1 py-3">
              <Newspaper className="w-5 h-5 text-cyan-500" />
              <span className="text-xs">Artigos</span>
            </TabsTrigger>
            <TabsTrigger value="assuntos" className="flex-col gap-1 py-3">
              <BookOpen className="w-5 h-5 text-teal-500" />
              <span className="text-xs">Assuntos</span>
            </TabsTrigger>
            <TabsTrigger value="guias" className="flex-col gap-1 py-3">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <span className="text-xs">Guias</span>
            </TabsTrigger>
            <TabsTrigger value="exportar" className="flex-col gap-1 py-3">
              <Download className="w-5 h-5 text-gray-500" />
              <span className="text-xs">Exportar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsList
              questions={questions}
              isDataLoading={isDataLoading}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onRefreshQuestions={loadQuestions}
              subjectNames={subjectNames}
              institutionNames={institutionNames}
            />
          </TabsContent>

          <TabsContent value="new-question">
            <ModernQuestionForm
              questionToEdit={selectedQuestion}
              onQuestionSaved={handleSaveQuestion}
              onCancel={() => { setSelectedQuestion(null); setActiveTab('questions'); }}
              allSubjects={allSubjects}
              allInstitutions={allInstitutions}
            />
          </TabsContent>

          <TabsContent value="import">
            <QuestionImporter />
          </TabsContent>

          <TabsContent value="provas">
            <ProvasEnviadasList />
          </TabsContent>

          <TabsContent value="assinaturas">
            <SubscriptionsList />
          </TabsContent>

          <TabsContent value="conteudo">
            <AdminContentForm
              content={welcomeContent}
              onSave={handleContentSave}
            />
          </TabsContent>

          <TabsContent value="assuntos">
            <TopicManager />
          </TabsContent>
          
          <TabsContent value="videos">
            <VideoManager />
          </TabsContent>

          <TabsContent value="artigos" className="mt-6">
            <ArticleManager />
          </TabsContent>

          <TabsContent value="guias" className="mt-6">
            <GuideManager />
          </TabsContent>

          <TabsContent value="exportar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Questões</CardTitle>
              </CardHeader>
              <CardContent className="space-x-2">
                <Button onClick={() => handleExport('csv')} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('xml')} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar XML
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedbacks" className="mt-6">
            <FeedbackManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}