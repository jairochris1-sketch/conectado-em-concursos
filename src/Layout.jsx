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
  BookOpen as BookOpenIcon, // Added for the new item
} from "lucide-react";
import { User } from "@/entities/User";
import { UserAnswer } from "@/entities/UserAnswer";
import { Subscription } from "@/entities/Subscription";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNavBar from "./components/navigation/BottomNavBar";
import ProvaUploader from "./components/upload/ProvaUploader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

import NotificationDropdown from './components/notifications/NotificationDropdown';
import { ThemeToggle } from './components/ui/theme-toggle';

const navigationItems = [
  {
    title: "Meu Painel",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Questões",
    url: createPageUrl("Questions"),
    icon: FileText,
  },
  {
    title: "Provas",
    url: createPageUrl("Exams"),
    icon: BookCopy,
  },
  {
    title: "Resumos",
    url: createPageUrl("ComoEstudarPrimeiroLugar"),
    icon: BookOpenIcon,
  },
  {
    title: "Área de Estudos",
    url: createPageUrl("Studies"),
    icon: BookOpen,
  },
  {
    title: "Planos",
    url: createPageUrl("Subscription"),
    icon: CreditCard, // changed from DollarSign
  }
];

const moreMenuItems = [
  {
    title: "ChatGPT",
    url: createPageUrl("ChatGPT"),
    icon: Bot,
  },
  {
    title: "Cronograma de Estudos",
    url: createPageUrl("Schedule"),
    icon: Calendar,
  },
  {
    title: "Ranking de Usuários",
    url: createPageUrl("Ranking"),
    icon: Trophy,
  },
  {
    title: "Lousa Digital",
    url: createPageUrl("DigitalWhiteboard"),
    icon: Pencil,
  },
  {
    title: "Minhas Anotações",
    url: createPageUrl("Notes"),
    icon: ClipboardList,
  },
  {
    title: "Simulados Digital",
    url: createPageUrl("SimuladosDigital"),
    icon: ClipboardList,
  },
  {
    title: "Meu Perfil",
    url: createPageUrl("Profile"),
    icon: Shield,
  },
  {
    title: "Minhas Estatísticas",
    url: createPageUrl("Statistics"),
    icon: BarChart3,
  },
];

const pageNameTranslations = {
  Dashboard: "Meu Painel",
  Questions: "Questões",
  Exams: "Provas",
  Studies: "Área de Estudos",
  Schedule: "Cronograma de Estudos",
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
  ComoEstudarPrimeiroLugar: "Resumos",
  GuiaEstudos: "Guia de Estudos",
};

const featureAccess = {
  'Área de Estudos': ['padrao', 'avancado'],
  'Cronograma de Estudos': ['padrao', 'avancado'],
  'ChatGPT': ['padrao', 'avancado'],
  'Criar Simulado': ['avancado'],
  'Concursos Abertos': ['padrao', 'avancado'],
  'Planos': ['gratuito', 'padrao', 'avancado'],
  'Lousa Digital': ['avancado'],
  'Minhas Anotações': ['padrao', 'avancado'],
  'Simulados Digital': ['padrao', 'avancado'],
  'Resumos': ['avancado'],
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
    style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
  padrao: {
    label: "Plano Padrão",
    icon: Star,
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  avancado: {
    label: "Plano Avançado",
    icon: Shield,
    style: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [showProvaUploader, setShowProvaUploader] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trialNotification, setTrialNotification] = useState({ show: false, days: 0 });
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  const [sidebarStats, setSidebarStats] = React.useState({
    streak: 0,
    todayQuestions: 0,
    accuracy: 0,
  });

  const isAdmin = user && (user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com');
  
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor') || '#0464fc';
    const savedIconSizeKey = localStorage.getItem('iconSizeKey') || 'md';
    const iconSizes = { sm: '0.875rem', md: '1rem', lg: '1.25rem' };

    document.documentElement.style.setProperty('--primary-color', savedColor);
    document.documentElement.style.setProperty('--icon-size', iconSizes[savedIconSizeKey]);
  }, []);

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
        
        if (userData.current_plan === 'gratuito' && !userData.trial_used && activeSubscriptions.length === 0) {
            console.log("Iniciando período de teste para usuário 'gratuito'.");
            await User.updateMyUserData({ 
                current_plan: 'avancado',
                trial_start_date: new Date().toISOString(),
                trial_used: true
            });
            userData = await User.me(); 
            setUser(userData);
        }
        
        if (activeSubscriptions.length === 0 && userData.trial_start_date && userData.current_plan === 'avancado') {
            const trialStartDate = new Date(userData.trial_start_date);
            const now = new Date();
            const diffTime = now.getTime() - trialStartDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            const trialDuration = 10;
            const daysRemaining = trialDuration - diffDays;

            if (daysRemaining <= 0) {
                console.log("Trial expired. Downgrading plan to 'gratuito'.");
                await User.updateMyUserData({ current_plan: 'gratuito' });
                userData = { ...userData, current_plan: 'gratuito' }; 
                setUser(userData);
                setTrialNotification({ show: false, days: 0 });
            } else if (daysRemaining > 0 && daysRemaining <= 3) {
                setTrialNotification({ show: true, days: Math.ceil(daysRemaining) });
            } else {
                setTrialNotification({ show: false, days: 0 });
            }
        } else {
            setTrialNotification({ show: false, days: 0 });
        }
        
        const userPlan = userData.current_plan || 'gratuito';
        const userIsAdmin = userData.email === 'conectadoemconcursos@gmail.com' || userData.email === 'jairochris1@gmail.com';

        const currentTitle = pageNameTranslations[currentPageName] || currentPageName;
        if (!checkAccess(currentTitle, userPlan, userIsAdmin)) {
          navigate(createPageUrl('Subscription'));
          return;
        }
        
        if (userData.email) {
            const userAnswers = await UserAnswer.filter({ created_by: userData.email });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayAnswers = userAnswers.filter(a => {
                const answerDate = new Date(a.created_date);
                answerDate.setHours(0, 0, 0, 0);
                return answerDate.getTime() === today.getTime();
            });
            
            const totalCorrect = userAnswers.filter(a => a.is_correct).length;
            const accuracyRate = userAnswers.length > 0 ? Math.round((totalCorrect / userAnswers.length) * 100) : 0;
            
            const uniqueAnswerDatesMs = [...new Set(userAnswers.map(a => {
                const date = new Date(a.created_date);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            }))].sort((a, b) => a - b);

            let streak = 0;
            if (uniqueAnswerDatesMs.length > 0) {
                const todayNormalized = new Date();
                todayNormalized.setHours(0, 0, 0, 0);

                const yesterdayNormalized = new Date(todayNormalized);
                yesterdayNormalized.setDate(todayNormalized.getDate() - 1);
                yesterdayNormalized.setHours(0, 0, 0, 0);

                let currentReferenceDate = todayNormalized;
                
                const lastAnswerDateMs = uniqueAnswerDatesMs[uniqueAnswerDatesMs.length - 1];
                const lastAnswerDateObj = new Date(lastAnswerDateMs);
                lastAnswerDateObj.setHours(0,0,0,0);

                if (lastAnswerDateObj.getTime() === todayNormalized.getTime()) {
                    currentReferenceDate = todayNormalized;
                } else if (lastAnswerDateObj.getTime() === yesterdayNormalized.getTime()) {
                    currentReferenceDate = yesterdayNormalized;
                } else {
                    currentReferenceDate = new Date(0);
                }

                for (let i = uniqueAnswerDatesMs.length - 1; i >= 0; i--) {
                    const answeredDate = new Date(uniqueAnswerDatesMs[i]);
                    answeredDate.setHours(0, 0, 0, 0);

                    if (answeredDate.getTime() === currentReferenceDate.getTime()) {
                        streak++;
                        currentReferenceDate.setDate(currentReferenceDate.getDate() - 1);
                    } else if (answeredDate.getTime() < currentReferenceDate.getTime()) {
                        break;
                    }
                }
                
                if (currentReferenceDate.getTime() === new Date(0).getTime() && streak === 0) {
                    streak = 0;
                } else if (currentReferenceDate.getTime() === new Date(0).getTime() && streak > 0) {
                    streak = 0;
                }
            }

            setSidebarStats({
              streak: streak,
              todayQuestions: todayAnswers.length,
              accuracy: accuracyRate
            });
        } else {
            console.warn("User email not available, cannot fetch user answers for stats.");
        }

        if (!userData.onboarding_complete) {
          if (location.pathname !== createPageUrl('Welcome')) {
            navigate(createPageUrl('Welcome'));
          }
        }
      } catch (error) {
        console.warn("User not authenticated, redirecting to login:", error);
        await User.login();
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
      </div>
    );
  }

  if (location.pathname === createPageUrl('Welcome')) {
    return children;
  }

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-x-hidden" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#1c2c34' }}>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 text-white z-50 shadow-lg md:hidden flex flex-col"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-black border-opacity-20">
                <h2 className="font-bold text-lg">Menu Principal</h2>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 flex items-center gap-3 border-b border-black border-opacity-20">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.profile_photo_url} alt={user.full_name || 'User Avatar'} />
                  <AvatarFallback className="bg-white text-xs">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/89ef29054_LogoConectadoemConcursos.png" alt="Conectado em Concursos" className="w-full h-full object-contain"/>
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm truncate">{user.full_name || 'Usuário'}</p>
                  {user.job_title && (
                    <p className="text-xs text-gray-200 truncate">{user.job_title}</p>
                  )}
                  <div className={`mt-1 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${PlanInfo.style.replace(/bg-([a-z]+)-[0-9]+/g, 'bg-black/20').replace('text-gray-600', 'text-white/80').replace('text-blue-700', 'text-blue-200').replace('text-yellow-800', 'text-yellow-200')}`}>
                    <PlanInfo.icon className="w-3 h-3" />
                    {PlanInfo.label}
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {[...navigationItems, ...moreMenuItems].map((item) => {
                  const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                  return (
                    <Link
                      key={item.title}
                      to={hasAccess ? item.url : createPageUrl("Subscription")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-lg text-gray-300 transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon style={{ width: 'var(--icon-size, 1.25rem)', height: 'var(--icon-size, 1.25rem)' }} />
                        <span>{item.title}</span>
                      </div>
                      {!hasAccess && <Lock className="w-4 h-4 text-yellow-400" />}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <>
                  <Link
                    to={createPageUrl("Admin")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg text-red-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Shield style={{ width: 'var(--icon-size, 1.25rem)', height: 'var(--icon-size, 1.25rem)' }} />
                    <span>Admin Geral</span>
                  </Link>
                  <Link
                    to={createPageUrl("SDAdmin")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg text-red-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Shield style={{ width: 'var(--icon-size, 1.25rem)', height: 'var(--icon-size, 1.25rem)' }} />
                    <span>Admin Simulados Digital</span>
                  </Link>
                  </>
                )}
              </nav>
              <div className="p-4 border-t border-black border-opacity-20">
                  <Button onClick={handleLogout} variant="destructive" className="w-full bg-red-600 hover:bg-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="hidden md:flex text-white border-b px-4 h-20 items-center justify-between shadow-md sticky top-0 z-40 print-hide" style={{ backgroundColor: 'var(--primary-color)', borderBottomColor: 'rgba(0,0,0,0.2)' }}>
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 flex-shrink-0">
            <div
              className="relative w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <BookOpen className="w-4 h-4 text-white" />
              <Pencil className="w-3 h-3 text-yellow-300 absolute bottom-0 right-0" />
            </div>
            <div>
                <h2 className="font-bold text-white text-sm leading-tight">Conectado em</h2>
                <h2 className="font-bold text-white text-sm leading-tight">Concursos Públicos SE</h2>
                <div className="text-xs leading-tight" style={{ color: '#FFD700' }}>
                  ⭐⭐⭐⭐⭐
                </div>
            </div>
        </Link>

        <nav className="flex items-center justify-center gap-1 flex-grow max-w-6xl">
            {navigationItems.map((item) => {
                const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                const isCurrentPage = location.pathname === item.url;
                return (
                    <Link
                        key={item.title}
                        to={hasAccess ? item.url : createPageUrl("Subscription")}
                        className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                            isCurrentPage ? 'text-white' : 'text-gray-300 hover:text-white'
                        }`}
                        style={isCurrentPage ? { backgroundColor: 'rgba(0,0,0,0.2)' } : {}}
                        onMouseEnter={(e) => {
                            if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isCurrentPage) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <item.icon className="flex-shrink-0" style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                        <span className="truncate text-center leading-tight">{item.title}</span>
                        {!hasAccess && <Lock className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />}
                    </Link>
                );
            })}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <ChevronDown style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                        <span>Mais</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="text-white border-black border-opacity-20" style={{ backgroundColor: 'var(--primary-color)' }}>
                    {moreMenuItems.map((item) => {
                         const hasAccess = checkAccess(item.title, userPlan, isAdmin);
                         const isCurrentPage = location.pathname === item.url;
                         return (
                            <DropdownMenuItem key={item.title} asChild>
                                <Link 
                                    to={hasAccess ? item.url : createPageUrl("Subscription")} 
                                    className={`flex items-center justify-between w-full cursor-pointer text-sm`}
                                    style={isCurrentPage ? { backgroundColor: 'rgba(0,0,0,0.2)' } : {}}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                                        <span>{item.title}</span>
                                    </div>
                                    {!hasAccess && <Lock className="w-3 h-3 text-yellow-400" />}
                                </Link>
                            </DropdownMenuItem>
                         );
                    })}
                    {isAdmin && (
                        <>
                        <DropdownMenuItem asChild>
                             <Link to={createPageUrl("Admin")} className="flex items-center justify-between w-full cursor-pointer text-red-400 hover:text-red-300 text-sm">
                                <div className="flex items-center gap-2">
                                    <Shield style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                                    <span>Admin Geral</span>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link to={createPageUrl("SDAdmin")} className="flex items-center justify-between w-full cursor-pointer text-red-400 hover:text-red-300 text-sm">
                                <div className="flex items-center gap-2">
                                    <Shield style={{ width: 'var(--icon-size, 1rem)', height: 'var(--icon-size, 1rem)' }} />
                                    <span>Admin Simulados Digital</span>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            onClick={() => setShowProvaUploader(true)}
            size="sm"
            className="text-xs px-3 py-2 text-white hover:text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <Upload className="w-3 h-3 mr-1" />
            <span className="hidden 2xl:inline">Enviar Prova</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-black/10">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo_url} alt={user.full_name || 'User Avatar'} />
                  <AvatarFallback className="bg-white text-xs">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/89ef29054_LogoConectadoemConcursos.png" alt="Conectado em Concursos" className="w-full h-full object-contain"/>
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block">
                  <p className="font-medium text-xs truncate max-w-28">{user.full_name || 'Usuário'}</p>
                  {user.job_title && (
                    <p className="text-xs text-gray-200 truncate max-w-28">{user.job_title}</p>
                  )}
                  <div className={`mt-0.5 inline-flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${PlanInfo.style.replace(/bg-([a-z]+)-[0-9]+/g, 'bg-black/20').replace('text-gray-600', 'text-white/80').replace('text-blue-700', 'text-blue-200').replace('text-yellow-800', 'text-yellow-200')}`}>
                    <PlanInfo.icon className="w-3 h-3" />
                    {PlanInfo.label}
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="text-white border-black border-opacity-20" style={{ backgroundColor: 'var(--primary-color)' }}>
              {user.job_title && (
                <DropdownMenuItem className="cursor-default text-sm text-gray-200 flex items-center gap-2 opacity-80" disabled>
                  <BookOpen className="w-4 h-4" />
                  {user.job_title}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="cursor-pointer text-sm flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AnimatePresence>
        {showTrialBanner && trialNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-yellow-400 text-yellow-900 p-3 text-center text-sm font-medium relative z-30 print-hide"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>
                Seu período de teste encerra em <strong>{trialNotification.days} {trialNotification.days > 1 ? 'dias' : 'dia'}</strong>. 
                <Link to={createPageUrl('Subscription')} className="font-bold underline hover:text-yellow-800 ml-1">
                  Assine agora
                </Link> para não perder o acesso!
              </span>
            </div>
            <button 
              onClick={() => setShowTrialBanner(false)}
              className="absolute top-1/2 right-4 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-40 print-hide">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="-ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="w-6 h-6" />
                </Button>
                <div
                  className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  <BookOpen className="w-5 h-5 text-white" />
                  <Pencil className="w-3 h-3 text-white absolute bottom-0 right-0 opacity-90" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Conectado SE</h1>
                  <p className="text-xs dark:text-blue-400" style={{ color: 'var(--primary-color)' }}>Rumo à aprovação</p>
                  <div className="text-xs" style={{ color: '#FFD700' }}>⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={createPageUrl("Subscription")}>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-white"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
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
        >
          {children}
        </div>
      </main>

      <BottomNavBar userPlan={userPlan} checkAccess={checkAccess} isAdmin={isAdmin} className="print-hide" />

      <ProvaUploader isOpen={showProvaUploader} onOpenChange={setShowProvaUploader} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 md:bottom-6 right-6 z-50"
          >
            <Button
              size="icon"
              className="rounded-full h-12 w-12 text-white shadow-lg"
              style={{ backgroundColor: 'var(--primary-color)' }}
              onClick={scrollToTop}
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ThemeToggle />
    </div>
  );
}