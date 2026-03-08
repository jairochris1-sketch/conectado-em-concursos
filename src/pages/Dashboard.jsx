import { useState, useEffect } from "react";
import { UserAnswer, Simulation, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getWeek } from "date-fns"; // Importar getWeek
import {
  Trophy,
  Target,
  Calendar,
  FileText,
  BarChart3,
  Flame,
  Award,
  CheckCircle,
  Search,
  Brain,
  BookCopy,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

import StatsCards from "../components/dashboard/StatsCards";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import SubjectBreakdown from "../components/dashboard/SubjectBreakdown";
import StudySuggestions from "../components/dashboard/StudySuggestions";


// Array com as frases motivacionais
const motivationalQuotes = [
  "💪 “Disciplina hoje é liberdade amanhã. Continue firme!”",
  "📚 “A prova é só um dia, mas a sua preparação é todos os dias. Não pare agora!”",
  "🚀 “A persistência transforma sonhos em conquistas. Você está no caminho certo.”",
  "🌟 “Estudar pode ser cansativo, mas desistir nunca será uma opção para quem tem grandes objetivos.”",
  "🔑 “O segredo não é correr mais rápido, mas nunca parar. A aprovação vem para quem persiste.”",
  "🎯 “Cada sacrifício feito hoje será recompensado com a sua vitória amanhã.”",
  "🏆 “Concurso público não é sorte, é preparação. Continue e a sua hora vai chegar!”"
];


export default function Dashboard() {
  const [answers, setAnswers] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Seleciona uma frase com base na semana do ano
  const weekOfYear = getWeek(new Date());
  const motivationalQuote = motivationalQuotes[weekOfYear % motivationalQuotes.length];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Carrega os dados apenas depois de confirmar o usuário
        const [answersData, simulationsData] = await Promise.all([
          UserAnswer.filter({ created_by: user.email }, "-created_date", 100), // Limitado a 100
          Simulation.filter({ created_by: user.email }, "-created_date", 20)  // Limitado a 20
        ]);

        setAnswers(answersData);
        setSimulations(simulationsData);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        setCurrentUser(null); // Limpa o usuário em caso de erro de autenticação
        // Optionally handle user not found/logged in case, e.g., redirect to login
      }
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  const calculateStats = () => {
    const today = new Date().toDateString();
    const todayAnswers = answers.filter(a => new Date(a.created_date).toDateString() === today);
    const totalCorrect = answers.filter(a => a.is_correct).length;
    const accuracyRate = answers.length > 0 ? (totalCorrect / answers.length) * 100 : 0;

    // Calcular streak (dias consecutivos estudando)
    const dates = [...new Set(answers.map(a => new Date(a.created_date).toDateString()))].sort((a,b) => new Date(b) - new Date(a));
    let streak = 0;
    
    if (dates.length > 0) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const lastStudyDate = new Date(dates[0]);
      lastStudyDate.setHours(0, 0, 0, 0);

      const diffTime = todayDate - lastStudyDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) { // Se estudou hoje ou ontem, o streak é válido
        streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const current = new Date(dates[i]);
          current.setHours(0,0,0,0);
          const next = new Date(dates[i+1]);
          next.setHours(0,0,0,0);
          const dayDiff = (current - next) / (1000 * 60 * 60 * 24);
          if (dayDiff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }


    return {
      totalQuestions: answers.length,
      todayQuestions: todayAnswers.length,
      accuracyRate: Math.round(accuracyRate),
      streak,
      totalSimulations: simulations.length
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-3 md:p-8"> 
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-6 md:mb-8"
        >
          {/* Título + mensagens */}
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white capitalize">
              {getCurrentDateTime()}
            </h1>
            <div className="mt-2 space-y-1 text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <p>👋 {getGreeting()}, {currentUser?.full_name || 'user'}!</p>
              <p>“{motivationalQuote.replace(/^.*?[“"]|[”"]$/g, '')}”</p>
            </div>
          </div>

          {/* CTA principal + Ver Ranking */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link to={createPageUrl("Questions")} className="flex-1">
              <Button 
                className="w-full text-white shadow-sm rounded-md py-5 md:py-6 text-base md:text-lg"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                <FileText className="w-5 h-5 mr-2" />
                Resolver Questões
              </Button>
            </Link>
            <Link to={createPageUrl("CreateStudyPlan")} className="sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto rounded-md border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Criar Planejamento de Estudos
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatsCards
            title="Questões Hoje"
            value={stats.todayQuestions}
            icon={FileText}
            gradient="from-blue-500 to-blue-600"
            trend={`+${Math.round((stats.todayQuestions / (stats.totalQuestions || 1)) * 100)}% do total`}
          />
          <StatsCards
            title="Taxa de Acerto"
            value={`${stats.accuracyRate}%`}
            icon={Target}
            gradient="from-green-500 to-emerald-600"
            trend="Média geral"
          />
          <StatsCards
            title="Streak Atual"
            value={`${stats.streak} dias`}
            icon={Flame}
            gradient="from-orange-500 to-red-500"
            trend="Dias consecutivos"
          />
          <StatsCards
            title="Total de Questões"
            value={stats.totalQuestions.toLocaleString()}
            icon={Award}
            gradient="from-purple-500 to-indigo-600"
            trend="Questões resolvidas"
          />
        </div>

        {/* Gráficos e conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
          <div className="lg:col-span-2 space-y-6">
            <PerformanceChart answers={answers} isLoading={isLoading} />
            <div className="hidden md:block">
              <StudySuggestions answers={answers} />
            </div>
            <SubjectBreakdown answers={answers} isLoading={isLoading} />
          </div>
          <div className="space-y-6">


            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Links Rápidos</h3>
              <div className="space-y-3">
                <Link to={createPageUrl("SavedContests")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Encontrar Concursos
                  </Button>
                </Link>
                <Link to={createPageUrl("Schedule")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Cronograma de Estudos
                  </Button>
                </Link>
                <Link to={createPageUrl("Flashcards")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="w-4 h-4 mr-2" />
                    Flashcards
                  </Button>
                </Link>
                <Link to={createPageUrl("Notebooks")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookCopy className="w-4 h-4 mr-2" />
                    Cadernos de Questões
                  </Button>
                </Link>
                <Link to={createPageUrl("Community")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Fórum
                  </Button>
                </Link>
                <Link to={createPageUrl("Ranking")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="w-4 h-4 mr-2" />
                    Ver Ranking
                  </Button>
                </Link>
                <Link to={createPageUrl("Statistics")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Estatísticas Detalhadas
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:hidden">
              <StudySuggestions answers={answers} />
            </div>
          </div>
        </div>

        {/* Call to action motivacional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 md:p-8 text-white text-center shadow-2xl"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-xl md:text-2xl font-bold mb-4">Continue firme na sua jornada!</h2>
          <p className="text-base md:text-lg mb-6 opacity-90">
            Cada questão resolvida te aproxima mais da sua aprovação
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={createPageUrl("Questions")}>
              <Button size="lg" className="w-full sm:w-auto bg-white text-[var(--primary-color)] hover:bg-gray-100 font-semibold">
                <CheckCircle className="w-5 h-5 mr-2" />
                Resolver Questões Agora
              </Button>
            </Link>
            <Link to={createPageUrl("Ranking")}>
              <Button size="lg" className="w-full sm:w-auto border-2 border-white text-white bg-white/10 hover:bg-white/30 font-semibold">
                <Trophy className="w-5 h-5 mr-2" />
                Ver Minha Posição
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}