import { useEffect, useState } from 'react';
import { User, StudyPlan, UserAnswer } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Trash2, Eye, Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';

const SUBJECT_LABELS = {
  portugues: 'Português',
  matematica: 'Matemática',
  direito_constitucional: 'Direito Constitucional',
  direito_administrativo: 'Direito Administrativo',
  direito_penal: 'Direito Penal',
  direito_civil: 'Direito Civil',
  informatica: 'Informática',
  conhecimentos_gerais: 'Conhecimentos Gerais',
  raciocinio_logico: 'Raciocínio Lógico',
  contabilidade: 'Contabilidade',
  pedagogia: 'Pedagogia'
};

export default function StudyPlansPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        // Carregamento paralelo
        const [userPlans, allAnswers] = await Promise.all([
          StudyPlan.filter({ created_by: userData.email }, '-created_date', 50),
          UserAnswer.filter({ created_by: userData.email }, '-created_date', 1000)
        ]);

        setPlans(userPlans);
        setUserAnswers(allAnswers);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateProgress = (plan) => {
    if (!plan.schedule || plan.schedule.length === 0) return 0;

    const currentWeek = plan.progress?.current_week || 1;
    return Math.round((currentWeek / plan.schedule.length) * 100);
  };

  const getCurrentWeekGoals = (plan) => {
    if (!plan.schedule || plan.schedule.length === 0) return null;
    const currentWeekIndex = (plan.progress?.current_week || 1) - 1;
    return plan.schedule[currentWeekIndex];
  };

  const getWeekProgress = (plan) => {
    const currentWeek = getCurrentWeekGoals(plan);
    if (!currentWeek) return { questions: 0, target: 0, hours: 0, targetHours: 0 };

    const weekStart = new Date(currentWeek.start_date);
    const weekEnd = new Date(currentWeek.end_date);

    const weekAnswers = userAnswers.filter(a => {
      const answerDate = new Date(a.created_date);
      return answerDate >= weekStart && answerDate <= weekEnd;
    });

    return {
      questions: weekAnswers.length,
      target: currentWeek.target_questions,
      hours: Math.round((weekAnswers.length / 10) * 100) / 100, // Estimativa
      targetHours: currentWeek.target_hours
    };
  };

  const handleDeletePlan = async (planId) => {
    if (confirm('Tem certeza que deseja deletar este plano?')) {
      try {
        await StudyPlan.delete(planId);
        setPlans(plans.filter(p => p.id !== planId));
      } catch (error) {
        console.error('Erro ao deletar plano:', error);
        alert('Erro ao deletar plano');
      }
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800'
  };

  const statusLabels = {
    active: 'Ativo',
    completed: 'Completo',
    paused: 'Pausado'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Meus Planos de Estudo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Crie e acompanhe seus planos de estudo personalizados</p>
          </div>
          <Link to={createPageUrl('CreateStudyPlan')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-5 h-5" />
              Novo Plano
            </Button>
          </Link>
        </div>

        {/* Planos */}
        {plans.length === 0 ? (
          <Card className="dark:bg-gray-800 text-center p-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Nenhum plano de estudo criado</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Crie seu primeiro plano personalizado para organizar seus estudos</p>
            <Link to={createPageUrl('CreateStudyPlan')}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-5 h-5" />
                Criar Primeiro Plano
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => {
              const weekProgress = getWeekProgress(plan);
              const overallProgress = calculateProgress(plan);
              const currentWeek = getCurrentWeekGoals(plan);

              return (
                <Card key={plan.id} className="dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Cabeçalho do Plano */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={statusColors[plan.status]}>
                              {statusLabels[plan.status]}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              📅 {new Date(plan.start_date).toLocaleDateString('pt-BR')} até {new Date(plan.end_date).toLocaleDateString('pt-BR')}
                            </span>
                            {plan.schedule && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                📚 {plan.schedule.length} semanas
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(createPageUrl(`ViewStudyPlan?id=${plan.id}`))}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Disciplinas */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disciplinas</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.subjects.map((subject) => (
                            <Badge key={subject} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {SUBJECT_LABELS[subject] || subject}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Metas Semanais */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Meta Semanal</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {plan.weekly_goals.questions_per_week}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">questões</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Meta Semanal</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {plan.weekly_goals.study_hours_per_week}h
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">estudo</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Semana Atual</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {plan.progress?.current_week || 1}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">de {plan.schedule?.length || 0}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Questões</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {plan.progress?.questions_answered || 0}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">respondidas</p>
                        </div>
                      </div>

                      {/* Progresso Geral */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</p>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{overallProgress}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                      </div>

                      {/* Progresso da Semana Atual */}
                      {currentWeek && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Semana {plan.progress?.current_week || 1}: {new Date(currentWeek.start_date).toLocaleDateString('pt-BR')} - {new Date(currentWeek.end_date).toLocaleDateString('pt-BR')}
                          </h4>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Questões</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {weekProgress.questions} <span className="text-sm text-gray-600 dark:text-gray-400">/ {weekProgress.target}</span>
                              </p>
                              <Progress 
                                value={Math.min((weekProgress.questions / weekProgress.target) * 100, 100)} 
                                className="h-1.5 mt-2"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Horas de Estudo</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {weekProgress.hours.toFixed(1)}h <span className="text-sm text-gray-600 dark:text-gray-400">/ {weekProgress.targetHours}h</span>
                              </p>
                              <Progress 
                                value={Math.min((weekProgress.hours / weekProgress.targetHours) * 100, 100)} 
                                className="h-1.5 mt-2"
                              />
                            </div>
                          </div>

                          {currentWeek.subjects_focus && currentWeek.subjects_focus.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Foco desta semana:</p>
                              <div className="flex flex-wrap gap-2">
                                {currentWeek.subjects_focus.map((subject) => (
                                  <Badge key={subject} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                    {SUBJECT_LABELS[subject] || subject}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Link para Detalhes */}
                      <Link to={createPageUrl(`ViewStudyPlan?id=${plan.id}`)}>
                        <Button variant="outline" className="w-full dark:border-gray-600 dark:text-white">
                          Ver Detalhes e Cronograma Completo
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}