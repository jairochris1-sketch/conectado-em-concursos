import React, { useState, useEffect } from 'react';
import { User, UserAnswer, Simulation } from '@/entities/all';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PeriodFilter from '../components/reports/PeriodFilter';
import ProgressChart from '../components/reports/ProgressChart';
import SubjectPerformance from '../components/reports/SubjectPerformance';
import InstitutionPerformance from '../components/reports/InstitutionPerformance';
import UserComparison from '../components/reports/UserComparison';
import SimulationHistory from '../components/reports/SimulationHistory';
import { Toaster } from '@/components/ui/sonner';

const SUBJECT_LABELS = {
  portugues: 'Português',
  matematica: 'Matemática',
  raciocinio_logico: 'Raciocínio Lógico',
  informatica: 'Informática',
  conhecimentos_gerais: 'Conhecimentos Gerais',
  direito_constitucional: 'Direito Constitucional',
  direito_administrativo: 'Direito Administrativo',
  direito_penal: 'Direito Penal',
  direito_civil: 'Direito Civil',
  direito_tributario: 'Direito Tributário',
  direito_previdenciario: 'Direito Previdenciário',
  administracao_geral: 'Administração Geral',
  administracao_publica: 'Administração Pública',
  afo: 'AFO',
  gestao_pessoas: 'Gestão de Pessoas',
  administracao_recursos_materiais: 'Administração de Recursos Materiais',
  contabilidade: 'Contabilidade',
  economia: 'Economia',
};

function getPeriodStartDate(period) {
  const now = new Date();
  if (period === 'all') return new Date(0);
  const days = parseInt(period);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

export default function PerformanceReports() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [progressData, setProgressData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [institutionData, setInstitutionData] = useState([]);
  const [userStats, setUserStats] = useState({ taxaAcerto: 0, questoes: 0 });
  const [averageStats, setAverageStats] = useState({ taxaAcerto: 0, questoes: 0 });
  const [simulations, setSimulations] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadReportData = async () => {
      setLoading(true);
      try {
        const startDate = getPeriodStartDate(selectedPeriod);
        const allAnswers = await UserAnswer.filter({ created_by: currentUser.email });
        
        const filteredAnswers = allAnswers.filter(a => new Date(a.created_date) >= startDate);

        // Preparar dados de progresso
        const progressMap = {};
        filteredAnswers.forEach(answer => {
          const date = formatDateKey(new Date(answer.created_date));
          if (!progressMap[date]) {
            progressMap[date] = { acertos: 0, total: 0, taxa: 0 };
          }
          progressMap[date].total++;
          if (answer.is_correct) progressMap[date].acertos++;
        });

        const progressChartData = Object.entries(progressMap)
          .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('pt-BR'),
            acertos: data.acertos,
            taxa: (data.acertos / data.total) * 100,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setProgressData(progressChartData);

        // Preparar dados por disciplina
        const subjectMap = {};
        filteredAnswers.forEach(answer => {
          if (!subjectMap[answer.subject]) {
            subjectMap[answer.subject] = { acertos: 0, total: 0 };
          }
          subjectMap[answer.subject].total++;
          if (answer.is_correct) subjectMap[answer.subject].acertos++;
        });

        const subjectChartData = Object.entries(subjectMap)
          .map(([subject, data]) => ({
            disciplina: SUBJECT_LABELS[subject] || subject,
            acertos: data.acertos,
            total: data.total,
            taxa: (data.acertos / data.total) * 100,
          }))
          .sort((a, b) => b.taxa - a.taxa);

        setSubjectData(subjectChartData);

        // Preparar dados por banca (instituição)
        const institutionMap = {};
        filteredAnswers.forEach(answer => {
          if (!answer.institution) return;
          const instName = answer.institution.toUpperCase().replace(/_/g, ' ');
          if (!institutionMap[instName]) {
            institutionMap[instName] = { acertos: 0, total: 0 };
          }
          institutionMap[instName].total++;
          if (answer.is_correct) institutionMap[instName].acertos++;
        });

        const institutionChartData = Object.entries(institutionMap)
          .map(([instituicao, data]) => ({
            instituicao: instituicao,
            acertos: data.acertos,
            total: data.total,
            taxa: (data.acertos / data.total) * 100,
          }))
          .sort((a, b) => b.total - a.total); // Ordenar por mais respondidas

        setInstitutionData(institutionChartData);

        // Calcular estatísticas do usuário
        const totalCorrect = filteredAnswers.filter(a => a.is_correct).length;
        const taxaAcerto = filteredAnswers.length > 0 ? (totalCorrect / filteredAnswers.length) * 100 : 0;
        
        setUserStats({
          taxaAcerto: taxaAcerto,
          questoes: filteredAnswers.length,
        });

        // Calcular média de outros usuários (simulação)
        const allUsersAnswers = await UserAnswer.list();
        const averageTotal = allUsersAnswers.filter(a => new Date(a.created_date) >= startDate);
        const averageCorrect = averageTotal.filter(a => a.is_correct).length;
        const averageTaxa = averageTotal.length > 0 ? (averageCorrect / averageTotal.length) * 100 : 0;

        setAverageStats({
          taxaAcerto: averageTaxa,
          questoes: averageTotal.length,
        });

        // Carregar simulados
        const userSimulations = await Simulation.filter({ created_by: currentUser.email });
        const filteredSims = userSimulations.filter(s => new Date(s.created_date) >= startDate);
        setSimulations(filteredSims);
      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
      }
      setLoading(false);
    };

    loadReportData();
  }, [currentUser, selectedPeriod]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 md:p-8">
      <Toaster richColors position="top-center" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 px-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" /> Voltar
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Relatório de Desempenho
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Acompanhe seu progresso, identifique áreas de melhoria e compare seu desempenho.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <PeriodFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
        </motion.div>

        {progressData.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800 dark:text-blue-200">
              Nenhum dado disponível para este período. Resolva algumas questões para ver seus relatórios!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProgressChart data={progressData} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SubjectPerformance data={subjectData} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <InstitutionPerformance data={institutionData} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UserComparison userStats={userStats} averageStats={averageStats} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SimulationHistory simulations={simulations} loading={loading} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}