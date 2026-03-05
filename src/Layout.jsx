import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  FileText,
  BarChart3,
  Calendar,
  Trophy,
  LogOut,
  Shield,
  Star,
  Upload,
  BookOpen,
  BookCopy,
  CreditCard,
  Bot,
  Lock,
  User as UserIcon,
  ChevronDown,
  ArrowUp,
  Menu,
  X,
  AlertTriangle,
  Award,
  Pencil,
  ClipboardList,
  BookOpen as BookOpenIcon,
  MessageSquare,
  Brain,
  Target,
  HelpCircle,
  Users } from
"lucide-react";
import { User } from "@/entities/User";
import { UserAnswer } from "@/entities/UserAnswer";
import { Subscription } from "@/entities/Subscription";
import { UserStats } from "@/entities/UserStats";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNavBar from "./components/navigation/BottomNavBar";
import ProvaUploader from "./components/upload/ProvaUploader";
import { RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

import NotificationDropdown from './components/notifications/NotificationDropdown';
import { ThemeToggle } from './components/ui/theme-toggle';
import TrialCountdown from './components/trial/TrialCountdown';
import LastDayModal from './components/trial/LastDayModal';
import PlanAdvantagesBlock from './components/plans/PlanAdvantagesBlock';
import ChatWidget from './components/chat/ChatWidget';
import GlobalStudyPartnerChat from './components/chat/GlobalStudyPartnerChat';
import GlobalSearch from './components/search/GlobalSearch';

const navigationItems = [
{
  title: "Meu Painel",
  url: createPageUrl("Dashboard"),
  icon: Home
},
{
  title: "Questões",
  url: createPageUrl("Questions"),
  icon: FileText
},
{
  title: "Provas",
  url: createPageUrl("Exams"),
  icon: BookCopy
},
{
  title: "Meu Edital",
  url: createPageUrl("EditalSimulator"),
  icon: Target
},
{
  title: "Resumos",
  url: createPageUrl("ComoEstudarPrimeiroLugar"),
  icon: BookOpenIcon
},
{
  title: "Área de Estudos",
  url: createPageUrl("Studies"),
  icon: BookOpen
},
{
  title: "Planos",
  url: createPageUrl("Subscription"),
  icon: CreditCard
}];


const moreMenuCategories = [
  {
    title: "Estudos & Planejamento",
    items: [
      { title: "Cadernos de Questões", url: createPageUrl("Notebooks"), icon: BookCopy },
      { title: "Minhas Anotações", url: createPageUrl("Notes"), icon: ClipboardList },
      { title: "Cronograma de Estudos", url: createPageUrl("Schedule"), icon: Calendar },
      { title: "Planos de Estudo", url: createPageUrl("StudyPlans"), icon: Target },
      { title: "Minhas Dúvidas", url: createPageUrl("MyDoubts"), icon: HelpCircle },
      { title: "Revisões", url: createPageUrl("Reviews"), icon: RefreshCcw },
    ]
  },
  {
    title: "Desempenho & Estatísticas",
    items: [
      { title: "Relatórios", url: createPageUrl("PerformanceReports"), icon: BarChart3 },
      { title: "Minhas Estatísticas", url: createPageUrl("Statistics"), icon: BarChart3 },
      { title: "Ranking de Usuários", url: createPageUrl("Ranking"), icon: Trophy },
    ]
  },
  {
    title: "Comunidade",
    items: [
      { title: "Pessoas", url: createPageUrl("People"), icon: Users },
      { title: "Fórum", url: createPageUrl("Community"), icon: MessageSquare },
      { title: "Feed de Atividades", url: createPageUrl("ActivityFeed"), icon: BookOpen },
    ]
  },
  {
    title: "Cursos",
    items: [
      { title: "Curso de Inglês", url: createPageUrl("EnglishCourse"), icon: BookOpen },
      { title: "Curso de Matemática", url: createPageUrl("MathCourse"), icon: BookOpen },
      { title: "Raciocínio Lógico", url: createPageUrl("LogicCourse"), icon: Brain },
    ]
  },
  {
    title: "Simulados Extras",
    items: [
      { title: "Simulados Digital", url: createPageUrl("SimuladosDigital"), icon: ClipboardList },
      { title: "Histórico de Simulações", url: createPageUrl("SimulationHistory"), icon: ClipboardList },
      { title: "Revisão de Simulados", url: createPageUrl("SimulationReview"), icon: ClipboardList },
    ]
  },
  {
    title: "Conta",
    items: [
      { title: "Meu Perfil", url: createPageUrl("Profile"), icon: Shield },
      { title: "Painel de Assinaturas", url: createPageUrl("SubscriptionsDashboard"), icon: CreditCard },
    ]
  }
];

const moreMenuItems = moreMenuCategories.flatMap(c => c.items);


const pageNameTranslations = {
  SubscriptionsDashboard: "Painel de Assinaturas",
  Dashboard: "Meu Painel",
  People: "Pessoas",
  Questions: "Questões",
  Exams: "Provas",
  Studies: "Área de Estudos",
  Schedule: "Cronograma de Estudos",
  StudyPlans: "Planos de Estudo",
  CreateStudyPlan: "Criar Plano de Estudo",
  ViewStudyPlan: "Detalhes do Plano",
  Ranking: "Ranking de Usuários",
  Statistics: "Minhas Estatísticas",
  Profile: "Meu Perfil",
  Subscription: "Planos e Assinatura",
  Admin: "Painel do Administrador",
  Welcome: "Bem-Vindo(a)!",
  ExamView: "Visualização de Prova",
  CreateSimulation: "Criar Simulado",
  VideoAnalysis: "Análise de Vídeos",
  SavedContests: "Concursos Abertos",
  Notes: "Minhas Anotações",
  SimuladosDigital: "Simulados Digital",
  EditalVerticalizado: "Edital Verticalizado",
  SDAdmin: "Admin Simulados Digital",
  Reviews: "Revisões",
  ComoEstudarPrimeiroLugar: "Como Estudar",
  GuiaEstudos: "Guia de Estudos",
  Community: "Fórum da Comunidade",
  ActivityFeed: "Feed de Atividades",
  MathCourse: "Curso de Matemática Básica",
  EnglishCourse: "Curso de Inglês",
  LogicCourse: "Raciocínio Lógico para Concursos",
  Notebooks: "Cadernos de Questões",
  CreateNotebook: "Criar Caderno",
  SolveNotebook: "Resolver Caderno",
  NotebookStats: "Estatísticas do Caderno"
};

const featureAccess = {
  'Meu Painel': ['gratuito', 'padrao', 'avancado'],
  'Questões': ['gratuito', 'padrao', 'avancado'],
  'Provas': ['gratuito', 'padrao', 'avancado'],
  'Meu Edital': ['gratuito', 'padrao', 'avancado'],
  'Resumos': ['gratuito', 'padrao', 'avancado'],
  'Planos': ['gratuito', 'padrao', 'avancado'],
  'Painel de Assinaturas': ['gratuito', 'padrao', 'avancado'],
  'Meu Perfil': ['gratuito', 'padrao', 'avancado'],
  'Pessoas': ['padrao', 'avancado'],
  'Área de Estudos': ['padrao', 'avancado'],
  'Cronograma de Estudos': ['padrao', 'avancado'],
  'Revisões': ['padrao', 'avancado'],
  'Planos de Estudo': ['padrao', 'avancado'],
  'Criar Simulado': ['padrao', 'avancado'],
  'Concursos Abertos': ['padrao', 'avancado'],
  'Minhas Anotações': ['padrao', 'avancado'],
  'Simulados Digital': ['padrao', 'avancado'],
  'Ranking de Usuários': ['padrao', 'avancado'],
  'Curso de Inglês': ['padrao', 'avancado'],
  'Curso de Matemática': ['padrao', 'avancado'],
  'Raciocínio Lógico': ['padrao', 'avancado'],
  'Cadernos de Questões': ['padrao', 'avancado'],
  'Fórum': ['padrao', 'avancado'],
  'Favoritas': ['padrao', 'avancado'],
  'Relatórios': ['padrao', 'avancado'],
  'Minhas Estatísticas': ['padrao', 'avancado'],
  'Feed de Atividades': ['padrao', 'avancado'],
  'Minhas Dúvidas': ['padrao', 'avancado']
};

const checkAccess = (featureTitle, plan, isAdmin) => {
  if (isAdmin) {
    return true;
  }

  if (!featureAccess[featureTitle]) {
    return true;
  }
  return featureAccess[featureTitle].includes(plan);
};

const planStyles = {
  gratuito: {
    label: "Plano Gratuito",
    icon: Award,
    style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
  },
  padrao: {
    label: "Plano Padrão",
    icon: Star,
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
  },
  avancado: {
    label: "Plano Premium",
    icon: Shield,
    style: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  }
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [showProvaUploader, setShowProvaUploader] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const [sidebarStats, setSidebarStats] = React.useState({
    streak: 0,
    todayQuestions: 0,
    accuracy: 0
  });
  const [userStats, setUserStats] = React.useState(null);

  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#0464fc');
  const [iconSize, setIconSize] = useState(localStorage.getItem('iconSizeKey') || 'md');

  const isAdmin = user && (user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com' || user.email === 'juniorgmj2016@gmail.com');

  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor') || '#0464fc';
    const savedIconSizeKey = localStorage.getItem('iconSizeKey') || 'md';
    const iconSizes = { sm: '0.875rem', md: '1rem', lg: '1.25rem' };

    setPrimaryColor(savedColor);
    setIconSize(savedIconSizeKey);
    document.documentElement.style.setProperty('--primary-color', savedColor);
    document.documentElement.style.setProperty('--icon-size', iconSizes[savedIconSizeKey]);
  }, []);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
    localStorage.setItem('primaryColor', newColor);
    document.documentElement.style.setProperty('--primary-color', newColor);
  };

  const handleIconSizeChange = (sizeKey) => {
    const iconSizes = { sm: '0.875rem', md: '1rem', lg: '1.25rem' };
    setIconSize(sizeKey);
    localStorage.setItem('iconSizeKey', sizeKey);
    document.documentElement.style.setProperty('--icon-size', iconSizes[sizeKey]);
  };

  React.useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        let userData = await User.me();

        const activeSubscriptions = await Subscription.filter({ user_email: userData.email, status: 'active' });

        // Verificar se é um usuário especial
        const specialUsers = await base44.entities.SpecialUser.filter({ email: userData.email, is_active: true });
        let userPlan = userData.current_plan || 'gratuito';

        if (activeSubscriptions.length > 0) {
          const hasPremium = activeSubscriptions.some(sub => sub.plan === 'avancado');
          const hasStandard = activeSubscriptions.some(sub => sub.plan === 'padrao');
          if (hasPremium) {
            userPlan = 'avancado';
          } else if (hasStandard) {
            userPlan = 'padrao';
          } else {
            userPlan = activeSubscriptions[0].plan;
          }
        }

        if (specialUsers.length > 0) {
          const specialUser = specialUsers[0];
          // Verificar se ainda está válido
          if (!specialUser.valid_until || new Date(specialUser.valid_until) >= new Date()) {
            userPlan = specialUser.plan;
          }
        }

        userData = { ...userData, current_plan: userPlan };
        setUser(userData);

        const userIsAdmin = userData.email === 'conectadoemconcursos@gmail.com' || userData.email === 'jairochris1@gmail.com';

        const currentTitle = pageNameTranslations[currentPageName] || currentPageName;
        if (!checkAccess(currentTitle, userPlan, userIsAdmin)) {
          navigate(createPageUrl('Subscription'));
          return;
        }

        if (userData.email) {
          // Buscar estatísticas pré-calculadas
          const stats = await UserStats.filter({ user_email: userData.email });

          if (stats.length > 0) {
            setUserStats(stats[0]);
            setSidebarStats({
              streak: stats[0].streak_days || 0,
              todayQuestions: stats[0].today_questions || 0,
              accuracy: stats[0].accuracy_rate || 0
            });
          }
        }

        if (!userData.onboarding_complete) {
          if (location.pathname !== createPageUrl('Welcome')) {
            navigate(createPageUrl('Welcome'));
          }
        }
      } catch (error) {
        console.warn("User not authenticated, redirecting to login:", error);
        await base44.auth.redirectToLogin();
      }
    };
    checkAuthAndLoad();
  }, [location.pathname, navigate, currentPageName]);

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const userPlan = user?.current_plan || 'gratuito';
  const PlanInfo = planStyles[userPlan] || planStyles.gratuito;

  const getGreeting = (name) => {
    const hour = new Date().getHours();
    let greeting = "Olá";

    if (hour >= 5 && hour < 12) {
      greeting = "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Boa tarde";
    } else {
      greeting = "Boa noite";
    }

    return `${greeting}, ${name || 'usuário'}!`;
  };

  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>);

  }

  if (location.pathname === createPageUrl('Welcome')) {
    return children;
  }

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-x-hidden bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-3 focus:bg-blue-600 focus:text-white focus:rounded">
        Pular para conteúdo principal
      </a>
      <AnimatePresence>
        {isMobileMenuOpen &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 md:hidden" />

            <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-80 text-white z-50 shadow-2xl md:hidden flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--primary-color)', maxWidth: '85vw' }}>

              <div className="flex items-center justify-between p-4 border-b border-black border-opacity-20 flex-shrink-0">
                <h2 className="font-bold text-lg">Menu Principal</h2>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white active:scale-90 transition-transform" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
                  <X className="w-6 h-6" aria-hidden="true" />
                </Button>
              </div>

              <div className="p-4 flex items-center justify-between border-b border-black border-opacity-20 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={user.profile_photo_url} alt={user.full_name || 'User Avatar'} loading="lazy" />
                    <AvatarFallback className="bg-white text-xs">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/89ef29054_LogoConectadoemConcursos.png" alt="Conectado em Concursos" className="w-full h-full object-contain" loading="lazy" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{user.full_name || 'Usuário'}</p>
                    {user.job_title &&
                  <p className="text-xs text-gray-200 truncate">{user.job_title}</p>
                  }
                    <div className={`mt-1 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${PlanInfo.style.replace(/bg-([a-z]+)-[0-9]+/g, 'bg-black/20').replace('text-gray-600', 'text-white/80').replace('text-blue-700', 'text-blue-200').replace('text-yellow-800', 'text-yellow-200')}`}>
                      <PlanInfo.icon className="w-3 h-3" />
                      <span className="truncate">{PlanInfo.label}</span>
                    </div>
                  </div>
                </div>
                <Button
                onClick={handleLogout}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white active:scale-90 transition-transform flex-shrink-0 px-3"
                aria-label="Sair da conta">

                  <LogOut className="w-4 h-4 mr-1" aria-hidden="true" />
                  Sair
                </Button>
              </div>

              <nav className="flex-1 p-3 space-y-4 overflow-y-auto overscroll-contain" aria-label="Navegação do menu">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                  const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                  const isCurrentPage = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={hasAccess ? item.url : createPageUrl("Subscription")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 active:scale-95 ${
                      isCurrentPage ? 'bg-white/20 text-white' : 'text-gray-200'}`
                      }
                      style={isCurrentPage ? {} : {}}
                      onMouseEnter={(e) => !isCurrentPage && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.15)')}
                      onMouseLeave={(e) => !isCurrentPage && (e.currentTarget.style.backgroundColor = 'transparent')}>

                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate text-sm font-medium">{item.title}</span>
                        </div>
                        {!hasAccess && <Lock className="w-4 h-4 text-yellow-300 flex-shrink-0" />}
                      </Link>);
                  })}
                </div>
                
                <div className="h-px bg-white/10 w-full my-2"></div>
                
                {moreMenuCategories.map((category) => (
                  <div key={category.title} className="space-y-1">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-3 mb-2 mt-4">
                      {category.title}
                    </h3>
                    {category.items.map((item) => {
                      const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                      const isCurrentPage = location.pathname === item.url;
                      return (
                        <Link
                          key={item.title}
                          to={hasAccess ? item.url : createPageUrl("Subscription")}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 active:scale-95 ${
                          isCurrentPage ? 'bg-white/20 text-white' : 'text-gray-200'}`
                          }
                          onMouseEnter={(e) => !isCurrentPage && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.15)')}
                          onMouseLeave={(e) => !isCurrentPage && (e.currentTarget.style.backgroundColor = 'transparent')}>

                            <div className="flex items-center gap-3 min-w-0">
                              <item.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="truncate text-sm font-medium">{item.title}</span>
                            </div>
                            {!hasAccess && <Lock className="w-4 h-4 text-yellow-300 flex-shrink-0" />}
                          </Link>
                      );
                    })}
                  </div>
                ))}

                {isAdmin &&
                <div className="space-y-1 pt-4 border-t border-white/10 mt-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-3 mb-2">
                      Administração
                    </h3>
                    <Link
                    to={createPageUrl("Admin")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg text-red-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>

                      <Shield style={{ width: 'var(--icon-size, 1.25rem)', height: 'var(--icon-size, 1.25rem)' }} />
                      <span>Admin Geral</span>
                    </Link>
                    <Link
                    to={createPageUrl("SDAdmin")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg text-red-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>

                      <Shield style={{ width: 'var(--icon-size, 1.25rem)', height: 'var(--icon-size, 1.25rem)' }} />
                      <span>Admin Simulados Digital</span>
                    </Link>
                </div>
                }
              </nav>
            </motion.div>
          </>
        }
      </AnimatePresence>

      <header className="hidden md:flex text-white border-b px-4 h-20 items-center justify-between shadow-md sticky top-0 z-40 print-hide" role="banner" style={{ backgroundColor: 'var(--primary-color)', borderBottomColor: 'rgba(0,0,0,0.2)' }}>
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 flex-shrink-0">
            <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png"
            alt="Logo Conectado em Concursos"
            className="w-10 h-10 object-contain shadow-lg" />

            <div>
                <h2 className="text-white text-sm font-semibold text-justify normal-case leading-tight">Conectado em Concursos </h2>
                <h2 className="font-bold text-white text-sm leading-tight"></h2>
                


            </div>
        </Link>

        <nav className="flex items-center justify-center gap-1 flex-grow max-w-6xl" aria-label="Navegação principal">
            {navigationItems.map((item) => {
            const hasAccess = checkAccess(item.title, userPlan, isAdmin);
            const isCurrentPage = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={hasAccess ? item.url : createPageUrl("Subscription")} className="bg-transparent text-amber-100 px-2 py-2 text-base font-bold rounded-lg relative flex flex-col items-center gap-1 transition-colors min-w-0 hover:text-white"



                style={isCurrentPage ? { backgroundColor: 'rgba(0,0,0,0.2)' } : {}}
                onMouseEnter={(e) => {
                  if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'transparent';
                }}>

                        <item.icon className="flex-shrink-0" style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                        <span className="text-base font-semibold text-center leading-tight truncate">{item.title}</span>
                        {!hasAccess && <Lock className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />}
                    </Link>);

          })}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>

                        <ChevronDown style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                        <span>Mais</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
              className="text-white border-black border-opacity-20 w-[700px] max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--primary-color)' }}
              align="center">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                    {moreMenuCategories.map((category) => (
                        <div key={category.title} className="space-y-2">
                          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider px-2 mb-2">
                            {category.title}
                          </h3>
                          <div className="space-y-1">
                            {category.items.map((item) => {
                              const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                              const isCurrentPage = location.pathname === item.url;
                              return (
                                <DropdownMenuItem key={item.title} asChild>
                                  <Link
                                    to={hasAccess ? item.url : createPageUrl("Subscription")}
                                    className={`flex items-center justify-between w-full cursor-pointer text-sm px-3 py-2 rounded-lg transition-colors ${isCurrentPage ? 'bg-white/20 text-white' : 'text-gray-200 hover:bg-white/10'}`}>
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{item.title}</span>
                                    </div>
                                    {!hasAccess && <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </div>
                    ))}
                    {isAdmin &&
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider px-2 mb-2">
                            Administração
                          </h3>
                          <div className="space-y-1">
                            <DropdownMenuItem asChild>
                                 <Link to={createPageUrl("Admin")} className="flex items-center justify-between w-full cursor-pointer text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span>Admin Geral</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                 <Link to={createPageUrl("SDAdmin")} className="flex items-center justify-between w-full cursor-pointer text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span>Admin Simulados Digital</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                          </div>
                        </div>
                    }
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <GlobalSearch />
          <Button
            onClick={() => setShowProvaUploader(true)}
            size="sm"
            className="text-xs px-3 py-2 text-white hover:text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>

            <Upload className="w-3 h-3 mr-1" />
            <span className="hidden 2xl:inline">Enviar Prova</span>
          </Button>
          {(userPlan === 'gratuito') && (
            <Link to={createPageUrl("Subscription")}>
              <Button
                size="sm"
                className="text-xs px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold shadow-sm transition-all"
              >
                <Star className="w-3 h-3 mr-1 fill-current" />
                Assinar Premium
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <NotificationDropdown />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-black/10">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo_url} alt={user.full_name || 'User Avatar'} />
                  <AvatarFallback className="bg-white text-xs">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/89ef29054_LogoConectadoemConcursos.png" alt="Conectado em Concursos" className="w-full h-full object-contain" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block">
                  <p className="font-medium text-xs truncate max-w-28">{user.full_name || 'Usuário'}</p>
                  {user.job_title &&
                  <p className="text-xs text-gray-200 truncate max-w-28">{user.job_title}</p>
                  }
                  <div className={`mt-0.5 inline-flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${PlanInfo.style.replace(/bg-([a-z]+)-[0-9]+/g, 'bg-black/20').replace('text-gray-600', 'text-white/80').replace('text-blue-700', 'text-blue-200').replace('text-yellow-800', 'text-yellow-200')}`}>
                    <PlanInfo.icon className="w-3 h-3" />
                    {PlanInfo.label}
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="text-white border-black border-opacity-20 w-64" style={{ backgroundColor: 'var(--primary-color)' }}>
              {user.job_title &&
              <DropdownMenuItem className="cursor-default text-sm text-gray-200 flex items-center gap-2 opacity-80" disabled>
                  <BookOpen className="w-4 h-4" />
                  {user.job_title}
                </DropdownMenuItem>
              }
              <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="cursor-pointer text-sm flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              <div className="h-px bg-white/20 my-2 mx-2" />
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider px-2">Aparência do Menu</p>
                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">Cor Principal</span>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={handleColorChange}
                      className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">Tamanho Ícones</span>
                    <div className="flex gap-1 bg-black/20 p-0.5 rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); handleIconSizeChange('sm'); }}
                        className={`h-6 w-6 p-0 text-[10px] rounded-sm ${iconSize === 'sm' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                      >
                        P
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); handleIconSizeChange('md'); }}
                        className={`h-6 w-6 p-0 text-[10px] rounded-sm ${iconSize === 'md' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                      >
                        M
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); handleIconSizeChange('lg'); }}
                        className={`h-6 w-6 p-0 text-[10px] rounded-sm ${iconSize === 'lg' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                      >
                        G
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-px bg-white/20 my-2 mx-2" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300 text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <PlanAdvantagesBlock />

      <main className="flex-1 flex flex-col min-w-0" id="main-content">
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-40 print-hide">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="-ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu de navegação" aria-expanded={isMobileMenuOpen}>
                   <Menu className="w-6 h-6" aria-hidden="true" />
                 </Button>
                <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png"
                alt="Logo Conectado em Concursos"
                className="w-8 h-8 object-contain" />

                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Conectado SE</h1>
                  <p className="text-xs dark:text-blue-400" style={{ color: 'var(--primary-color)' }}>Rumo à aprovação</p>
                  <div className="text-xs" style={{ color: '#FFD700' }}>⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GlobalSearch isMobile />
                {(userPlan === 'gratuito') && (
                  <Link to={createPageUrl("Subscription")}>
                    <Button
                    variant="default"
                    size="sm"
                    className="text-white"
                    style={{ backgroundColor: 'var(--primary-color)' }}>

                      <CreditCard className="w-4 h-4 mr-1" />
                      Assinar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

        <header className="bg-white px-6 py-3 hidden md:flex dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 items-center justify-between shadow-sm print-hide">
            <h1 className="bg-transparent text-gray-900 text-xl font-bold dark:text-white">
              {pageNameTranslations[currentPageName] || currentPageName}
            </h1>
            <div className="flex items-center gap-2">
            </div>
        </header>

        <div
          className="flex-1 overflow-auto pb-20 md:pb-0"
          style={{ backgroundColor: '#1c2c34' }}
          role="main">

          {children}
        </div>
      </main>

      <BottomNavBar userPlan={userPlan} checkAccess={checkAccess} isAdmin={isAdmin} className="print-hide" />

      <ProvaUploader isOpen={showProvaUploader} onOpenChange={setShowProvaUploader} />

      <AnimatePresence>
        {showScrollTop &&
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 md:bottom-6 right-6 z-40">

            <Button
            size="icon"
            className="rounded-full h-12 w-12 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={scrollToTop}
            aria-label="Voltar ao topo">

              <ArrowUp className="h-6 w-6" aria-hidden="true" />
            </Button>
          </motion.div>
        }
      </AnimatePresence>

      <ChatWidget />
      <GlobalStudyPartnerChat currentUser={user} />
      </div>);

}