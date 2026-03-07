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
  Users,
  LayoutGrid } from
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
import GlobalSearch from './components/search/GlobalSearch';

const navigationItems = [
{
  title: "Meu Painel",
  url: createPageUrl("Dashboard"),
  icon: LayoutGrid
},
{
  title: "Questões",
  url: createPageUrl("Questions"),
  icon: FileText
},
{
  title: "Provas",
  url: createPageUrl("Exams"),
  icon: ClipboardList
},
{
  title: "Meu Edital",
  url: createPageUrl("EditalSimulator"),
  icon: FileText
},
{
  title: "Resumos",
  url: createPageUrl("GuiaEstudos") + "?slug=guia_aprovacao",
  icon: BookCopy
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


const moreMenuItems = [
{
  title: "Pessoas",
  url: createPageUrl("People"),
  icon: Users
},
{
  title: "Simulado por Edital",
  url: createPageUrl("EditalSimulator"),
  icon: Target
},
{
  title: "Cadernos de Questões",
  url: createPageUrl("Notebooks"),
  icon: BookCopy
},
{
  title: "Minhas Dúvidas",
  url: createPageUrl("MyDoubts"),
  icon: HelpCircle
},
{
  title: "Curso de Inglês",
  url: createPageUrl("EnglishCourse"),
  icon: BookOpen
},
{
  title: "Curso de Matemática",
  url: createPageUrl("MathCourse"),
  icon: BookOpen
},
{
  title: "Raciocínio Lógico",
  url: createPageUrl("LogicCourse"),
  icon: Brain
},
{
  title: "Fórum",
  url: createPageUrl("Community"),
  icon: MessageSquare
},
{
  title: "Feed de Atividades",
  url: createPageUrl("ActivityFeed"),
  icon: BookOpen
},
{
  title: "Favoritas",
  url: createPageUrl("FavoriteQuestions"),
  icon: Star
},
{
  title: "Relatórios",
  url: createPageUrl("PerformanceReports"),
  icon: BarChart3
},
{
  title: "ChatGPT",
  url: createPageUrl("ChatGPT"),
  icon: Bot
},
{
  title: "Cronograma de Estudos",
  url: createPageUrl("Cronograma"),
  icon: Calendar
},
{
  title: "Planos de Estudo",
  url: createPageUrl("StudyPlans"),
  icon: Target
},
{
  title: "Ranking de Usuários",
  url: createPageUrl("Ranking"),
  icon: Trophy
},
{
  title: "Lousa Digital",
  url: createPageUrl("DigitalWhiteboard"),
  icon: Pencil
},
{
  title: "Minhas Anotações",
  url: createPageUrl("Notes"),
  icon: ClipboardList
},
{
  title: "Simulados Digital",
  url: createPageUrl("SimuladosDigital"),
  icon: ClipboardList
},
{
  title: "Histórico de Simulações",
  url: createPageUrl("SimulationHistory"),
  icon: ClipboardList
},
{
  title: "Revisão de Simulados",
  url: createPageUrl("SimulationReview"),
  icon: ClipboardList
},
{
  title: "Meu Perfil",
  url: createPageUrl("Profile"),
  icon: Shield
},
{
  title: "Minhas Estatísticas",
  url: createPageUrl("Statistics"),
  icon: BarChart3
}];


const pageNameTranslations = {
  Dashboard: "Meu Painel",
  People: "Pessoas",
  Questions: "Questões",
  Exams: "Provas",
  Studies: "Área de Estudos",
  Schedule: "Cronograma de Estudos",
  Cronograma: "Cronograma de Estudos",
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
  ChatGPT: "ChatGPT - IA de Estudos",
  VideoAnalysis: "Análise de Vídeos",
  SavedContests: "Concursos Abertos",
  DigitalWhiteboard: "Lousa Digital",
  Notes: "Minhas Anotações",
  SimuladosDigital: "Simulados Digital",
  SDAdmin: "Admin Simulados Digital",
  GuiaEstudos: "Resumos",
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
  'Pessoas': ['gratuito', 'padrao', 'avancado'],
  'Questões': ['gratuito', 'padrao', 'avancado'],
  'Área de Estudos': ['avancado'],
  'Cronograma de Estudos': ['avancado'],
  'Planos de Estudo': ['avancado'],
  'ChatGPT': ['avancado'],
  'Criar Simulado': ['avancado'],
  'Concursos Abertos': ['avancado'],
  'Planos': ['gratuito', 'padrao', 'avancado'],
  'Lousa Digital': ['avancado'],
  'Minhas Anotações': ['avancado'],
  'Simulados Digital': ['avancado'],
  'Resumos': ['avancado'],
  'Provas': ['avancado'],
  'Ranking de Usuários': ['padrao', 'avancado'],
  'Curso de Inglês': ['avancado'],
  'Curso de Matemática': ['avancado'],
  'Raciocínio Lógico': ['avancado'],
  'Cadernos de Questões': ['avancado'],
  'Simulado por Edital': ['avancado'],
  'Meu Edital': ['avancado'],
  'Fórum': ['avancado'],
  'Favoritas': ['gratuito', 'padrao', 'avancado'],
  'Relatórios': ['padrao', 'avancado'],
  'Minhas Estatísticas': ['gratuito', 'padrao', 'avancado'],
  'Meu Perfil': ['gratuito', 'padrao', 'avancado'],
  'Feed de Atividades': ['padrao', 'avancado'],
  'Minhas Dúvidas': ['avancado']
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
    label: "Plano Avançado",
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

  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#0464fc');
  const [iconSizeKey, setIconSizeKey] = useState(localStorage.getItem('iconSizeKey') || 'md');
  const [iconColorType, setIconColorType] = useState(localStorage.getItem('iconColorType') || 'branco');
  const [iconCustomColor, setIconCustomColor] = useState(localStorage.getItem('iconCustomColor') || '#fde047');

  const [sidebarStats, setSidebarStats] = React.useState({
    streak: 0,
    todayQuestions: 0,
    accuracy: 0
  });
  const [userStats, setUserStats] = React.useState(null);

  const isAdmin = user && (user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com' || user.email === 'juniorgmj2016@gmail.com');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const sizes = { sm: '0.875rem', md: '1rem', lg: '1.25rem' };
    document.documentElement.style.setProperty('--icon-size', sizes[iconSizeKey]);
    localStorage.setItem('iconSizeKey', iconSizeKey);
  }, [iconSizeKey]);

  useEffect(() => {
    localStorage.setItem('iconColorType', iconColorType);
    localStorage.setItem('iconCustomColor', iconCustomColor);
    document.documentElement.style.setProperty('--nav-icon-color', iconColorType === 'cor' ? iconCustomColor : 'currentColor');
  }, [iconColorType, iconCustomColor]);

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
        setUser(userData);

        const activeSubscriptions = await Subscription.filter({ user_email: userData.email, status: 'active' });

        // Verificar se é um usuário especial
        const specialUsers = await base44.entities.SpecialUser.filter({ email: userData.email, is_active: true });
        let userPlan = userData.current_plan || 'gratuito';

        if (specialUsers.length > 0) {
          const specialUser = specialUsers[0];
          // Verificar se ainda está válido
          if (!specialUser.valid_until || new Date(specialUser.valid_until) >= new Date()) {
            userPlan = specialUser.plan;
            userData = { ...userData, current_plan: userPlan };
            setUser(userData);
          }
        }



        userPlan = userData.current_plan || 'gratuito';
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
    <div className="min-h-screen flex flex-col w-full relative overflow-x-hidden" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#1c2c34' }}>
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

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain" aria-label="Navegação do menu">
                {[...navigationItems, ...moreMenuItems].map((item) => {
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
                {isAdmin &&
              <>
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
                  </>
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
                <h2 className="font-bold text-white text-sm leading-tight">Conectado em</h2>
                <h2 className="font-bold text-white text-sm leading-tight">Concursos Públicos SE</h2>
                <div className="text-xs leading-tight" style={{ color: '#FFD700' }}>
                  ⭐⭐⭐⭐⭐
                </div>
            </div>
        </Link>

        <nav className="flex items-center justify-center gap-1 flex-grow max-w-6xl" aria-label="Navegação principal">
            {navigationItems.map((item) => {
            const hasAccess = checkAccess(item.title, userPlan, isAdmin);
            const isCurrentPage = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={hasAccess ? item.url : createPageUrl("Subscription")} 
                className={`bg-transparent px-2 py-2 text-sm font-bold rounded-lg relative flex flex-col items-center gap-1 transition-colors min-w-0 hover:text-white ${isCurrentPage ? 'text-white' : 'text-white/80'}`}
                style={isCurrentPage ? { backgroundColor: 'rgba(0,0,0,0.2)' } : {}}
                onMouseEnter={(e) => {
                  if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'transparent';
                }}>

                        <item.icon className="flex-shrink-0" style={{ 
                          width: 'var(--icon-size, 1.25rem)', 
                          height: 'var(--icon-size, 1.25rem)',
                          color: 'var(--nav-icon-color)'
                        }} />
                        <span className="text-[13px] font-semibold text-center leading-tight truncate mt-1">{item.title}</span>
                        {!hasAccess && <Lock className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />}
                    </Link>);

          })}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 px-2 py-2 h-auto rounded-lg text-[13px] font-semibold text-white/80 hover:text-white"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>

                        <ChevronDown style={{ 
                          width: 'var(--icon-size, 1.25rem)', 
                          height: 'var(--icon-size, 1.25rem)',
                          color: 'var(--nav-icon-color)'
                        }} />
                        <span className="mt-1">Mais</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="text-white border-black border-opacity-20 w-[720px] max-h-[560px] overflow-y-auto" 
                  style={{ backgroundColor: 'var(--primary-color)' }}
                  align="center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                      {/* Estudos & Planejamento */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Estudos & Planejamento</p>
                        <div className="space-y-1">
                          {(() => { const title='Cadernos de Questões'; const url=createPageUrl('Notebooks'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Minhas Anotações'; const url=createPageUrl('Notes'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Criar Planejamento de Estudos'; const url=createPageUrl('CreateStudyPlan'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Minhas Dúvidas'; const url=createPageUrl('MyDoubts'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>

                      {/* Desempenho & Estatísticas */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Desempenho & Estatísticas</p>
                        <div className="space-y-1">
                          {(() => { const title='Relatórios'; const url=createPageUrl('PerformanceReports'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Minhas Estatísticas'; const url=createPageUrl('Statistics'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Ranking de Usuários'; const url=createPageUrl('Ranking'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><Trophy className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>

                      {/* Comunidade */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Comunidade</p>
                        <div className="space-y-1">
                          {(() => { const title='Pessoas'; const url=createPageUrl('People'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Fórum'; const url=createPageUrl('Community'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Feed de Atividades'; const url=createPageUrl('ActivityFeed'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>

                      {/* Quizzes */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Quizzes</p>
                        <div className="space-y-1">
                          {(() => { const display='Quiz de Inglês'; const title='Curso de Inglês'; const url=createPageUrl('EnglishCourse'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={display}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {display}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const display='Quiz de Matemática'; const title='Curso de Matemática'; const url=createPageUrl('MathCourse'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={display}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {display}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const display='Quiz de Raciocínio Lógico'; const title='Raciocínio Lógico'; const url=createPageUrl('LogicCourse'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={display}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {display}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>

                      {/* Simulados Extras */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Simulados Extras</p>
                        <div className="space-y-1">
                          {(() => { const title='Simulados Digital'; const url=createPageUrl('SimuladosDigital'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const display='Histórico de Simulações'; const title='Simulados Digital'; const url=createPageUrl('SimulationHistory'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={display}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {display}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const title='Revisão de Simulados'; const url=createPageUrl('SimulationReview'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>

                      {/* Conta */}
                      <div>
                        <p className="text-xs tracking-wider font-semibold text-white/80 uppercase mb-2">Conta</p>
                        <div className="space-y-1">
                          {(() => { const title='Meu Perfil'; const url=createPageUrl('Profile'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={title}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><UserIcon className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {title}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                          {(() => { const display='Painel de Assinaturas'; const title='Planos'; const url=createPageUrl('Subscription'); const hasAccess=checkAccess(title, userPlan, isAdmin); const isCurrent=location.pathname===url; return (
                            <DropdownMenuItem asChild key={display}>
                              <Link to={hasAccess ? url : createPageUrl('Subscription')} className={`flex items-center justify-between w-full cursor-pointer text-sm p-2.5 rounded-md hover:bg-black/20 ${isCurrent ? 'bg-black/20' : ''}`}>
                                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" style={{ color: 'var(--nav-icon-color)' }} /> {display}</span>
                                {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                              </Link>
                            </DropdownMenuItem>
                          ); })()}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="border-t border-white/20 mt-2 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('Admin')} className="flex items-center justify-between w-full cursor-pointer text-red-300 hover:text-red-200 text-sm p-2.5 rounded-md hover:bg-black/20 transition-colors">
                              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admin Geral</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('SDAdmin')} className="flex items-center justify-between w-full cursor-pointer text-red-300 hover:text-red-200 text-sm p-2.5 rounded-md hover:bg-black/20 transition-colors">
                              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admin Simulados Digital</span>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                      </div>
                    )}
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

            <Upload className="w-3 h-3 mr-1" style={{ color: 'var(--nav-icon-color)' }} />
            <span className="hidden 2xl:inline">Enviar Prova</span>
          </Button>
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
            <DropdownMenuContent className="text-white border-black border-opacity-20 w-64 shadow-2xl" style={{ backgroundColor: 'var(--primary-color)' }} align="end">
              <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="cursor-pointer text-sm flex items-center gap-3 p-3">
                <UserIcon className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(createPageUrl("Subscription"))} className="cursor-pointer text-sm flex items-center gap-3 p-3">
                <CreditCard className="w-4 h-4" />
                Painel de Assinaturas
              </DropdownMenuItem>
              
              <div className="h-px bg-white/20 my-2 mx-2" />
              
              <div className="p-3">
                <p className="text-[11px] tracking-wider font-semibold text-white/70 mb-3 uppercase">Aparência do Menu</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Cor Principal</span>
                  <div className="relative w-6 h-6 rounded border border-white/40 cursor-pointer overflow-hidden shadow-sm" style={{ backgroundColor: primaryColor }}>
                    <input 
                      type="color" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Tamanho Ícones</span>
                  <div className="flex gap-1 bg-black/20 p-1 rounded-md">
                    {['sm', 'md', 'lg'].map(size => {
                       const labels = { sm: 'P', md: 'M', lg: 'G' };
                       const isActive = iconSizeKey === size;
                       return (
                         <button
                           key={size}
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             setIconSizeKey(size);
                           }}
                           className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${isActive ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}`}
                         >
                           {labels[size]}
                         </button>
                       )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Cor dos Ícones</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-black/20 p-1 rounded-md">
                      {['branco', 'cor'].map(colorType => {
                         const isActive = iconColorType === colorType;
                         return (
                           <button
                             key={colorType}
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setIconColorType(colorType);
                             }}
                             className={`px-2 py-1 flex items-center justify-center rounded text-xs font-bold transition-colors ${isActive ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}`}
                           >
                             {colorType === 'branco' ? 'Branco' : 'Cor'}
                           </button>
                         )
                      })}
                    </div>
                    {iconColorType === 'cor' && (
                      <div className="relative w-6 h-6 rounded border border-white/40 cursor-pointer overflow-hidden shadow-sm" style={{ backgroundColor: iconCustomColor }}>
                        <input 
                          type="color" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          value={iconCustomColor}
                          onChange={(e) => setIconCustomColor(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/20 my-2 mx-2" />

              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-300 text-sm flex items-center gap-3 p-3">
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
              </div>
            </div>
          </header>

        <header className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 items-center justify-between shadow-sm print-hide">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
          className="fixed bottom-24 md:bottom-6 right-6 z-50">

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
      </div>);

}