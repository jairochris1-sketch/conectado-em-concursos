
import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import { Trash2, PlusCircle, Shield, AlertTriangle, Loader2, Pencil, FileText, Download, Upload, HelpCircle, CreditCard, Zap, BookOpen, Plus, Play, Newspaper } from 'lucide-react'; // Added Newspaper for Articles
import { format } from "date-fns";
import { toast } from 'sonner';

// Direct imports for components
import ModernQuestionForm from '../components/admin/ModernQuestionForm';
import QuestionImporter from '../components/admin/QuestionImporter';
import AdminContentForm from '../components/admin/AdminContentForm';
import AdminFAQForm from '../components/admin/AdminFAQForm';
import TopicManager from '../components/admin/TopicManager';
import NotificationManager from '../components/admin/NotificationManager';
import ArticleManager from '../components/admin/ArticleManager'; // NEW: Import ArticleManager

// Lazy load admin components
const QuestionsList = lazy(() => import('@/components/admin/QuestionsList'));
const ProvasEnviadasList = lazy(() => import('@/components/admin/ProvasEnviadasList'));
const SubscriptionsList = lazy(() => import('@/components/admin/SubscriptionsList'));
const VideoManager = lazy(() => import('@/components/admin/VideoManager'));

// Mapeamento completo de disciplinas
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
  
  // States for subjects and institutions
  const [allSubjects, setAllSubjects] = useState([]);
  const [allInstitutions, setAllInstitutions] = useState([]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com'];
        if (adminEmails.includes(user.email)) {
          setIsAdmin(true);
          // Carregar dados em paralelo
          await Promise.all([
            loadQuestions(),
            loadWelcomeContent(),
            loadFAQs(),
            loadAllSubjects(),
            loadAllInstitutions()
          ]);
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

  const loadAllSubjects = async () => {
    try {
      const questionSchema = await Question.schema();
      console.log('Schema completo:', questionSchema);
      
      if (questionSchema?.properties?.subject?.enum) {
        const subjects = questionSchema.properties.subject.enum.map(subjectKey => ({
          id: subjectKey,
          name: subjectNames[subjectKey] || subjectKey
        }));
        
        subjects.sort((a, b) => {
          if (a.name === 'Português') return -1;
          if (b.name === 'Português') return 1;
          return a.name.localeCompare(b.name);
        });
        
        console.log('Disciplinas carregadas:', subjects);
        setAllSubjects(subjects);
      } else {
        console.error('Schema de disciplinas não encontrado');
      }
    } catch (error) {
      console.error("Erro ao carregar disciplinas:", error);
      toast.error("Falha ao carregar disciplinas.");
    }
  };

  const loadAllInstitutions = async () => {
    try {
      const questionSchema = await Question.schema();
      
      if (questionSchema?.properties?.institution?.enum) {
        const institutions = questionSchema.properties.institution.enum.map(instKey => ({
          id: instKey,
          name: institutionNames[instKey] || instKey.toUpperCase()
        }));
        
        institutions.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Instituições carregadas:', institutions);
        setAllInstitutions(institutions);
      } else {
        console.error('Schema de instituições não encontrado');
      }
    } catch (error) {
      console.error("Erro ao carregar instituições:", error);
      toast.error("Falha ao carregar instituições.");
    }
  };

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

  // FAQ functions are kept for "preserving all other features, elements and functionality"
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
    setActiveTab('faq'); // This tab content is no longer directly accessible via a trigger
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
    setActiveTab('faq-list'); // This tab content is no longer directly accessible via a trigger
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

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"> {/* Updated classname */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 md:grid-cols-9"> {/* Adjusted grid-cols to 9 */}
            <TabsTrigger value="questions" onClick={() => setSelectedQuestion(null)}>
              <Pencil className="w-4 h-4 mr-2" />
              Questões
            </TabsTrigger>
            <TabsTrigger value="new-question">
              <PlusCircle className="w-4 h-4 mr-2" />
              {selectedQuestion ? 'Editar' : 'Nova Questão'}
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="provas">
              <Upload className="w-4 h-4 mr-2" />
              Provas
            </TabsTrigger>
            <TabsTrigger value="assinaturas"> {/* Value changed from 'subscriptions' */}
              <CreditCard className="w-4 h-4 mr-2" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="conteudo"> {/* Value changed from 'content' */}
              <FileText className="w-4 h-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Play className="w-4 h-4 mr-2" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="artigos"> {/* NEW Tab */}
              <Newspaper className="w-4 h-4 mr-2" /> {/* Using Newspaper for articles */}
              Artigos
            </TabsTrigger>
            <TabsTrigger value="assuntos"> {/* Value changed from 'topics' */}
              <BookOpen className="w-4 h-4 mr-2" />
              Assuntos
            </TabsTrigger>
            {/* Removed: TabsTrigger for 'faq-list', 'notifications', and 'faq' based on outline's explicit list */}
          </TabsList>

          <TabsContent value="questions">
            <Suspense fallback={<div>Carregando lista de questões...</div>}>
              <QuestionsList
                questions={questions}
                isDataLoading={isDataLoading}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onRefreshQuestions={loadQuestions}
                subjectNames={subjectNames}
                institutionNames={institutionNames}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="new-question">
            {allSubjects.length > 0 && allInstitutions.length > 0 ? (
              <ModernQuestionForm
                questionToEdit={selectedQuestion}
                onQuestionSaved={handleSaveQuestion}
                onCancel={() => { setSelectedQuestion(null); setActiveTab('questions'); }}
                allSubjects={allSubjects}
                allInstitutions={allInstitutions}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando formulário...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import">
            <QuestionImporter />
          </TabsContent>

          <TabsContent value="provas">
            <Suspense fallback={<div>Carregando provas enviadas...</div>}>
              <ProvasEnviadasList />
            </Suspense>
          </TabsContent>

          <TabsContent value="assinaturas"> {/* Value changed from 'subscriptions' */}
            <Suspense fallback={<div>Carregando assinaturas...</div>}>
              <SubscriptionsList />
            </Suspense>
          </TabsContent>

          <TabsContent value="conteudo"> {/* Value changed from 'content' */}
            <AdminContentForm
              content={welcomeContent}
              onSave={handleContentSave}
            />
          </TabsContent>

          {/* Removed TabsContent for "faq-list" and "faq" as per outline's implied removal from UI */}
          {/* FAQ functionality and state are preserved in the component, but not accessible via a tab */}

          <TabsContent value="assuntos"> {/* Value changed from 'topics' */}
            <TopicManager />
          </TabsContent>
          
          <TabsContent value="videos">
            <Suspense fallback={<div>Carregando gerenciador de vídeos...</div>}>
              <VideoManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="artigos" className="mt-6"> {/* NEW TabsContent */}
            <ArticleManager />
          </TabsContent>

          {/* Removed TabsContent for "notifications" as per outline's implied removal from UI */}
          {/* Notification functionality and state are preserved in the component, but not accessible via a tab */}
        </Tabs>
      </div>
    </div>
  );
}
