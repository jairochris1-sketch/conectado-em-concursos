import { useEffect, useState } from 'react';
import { StudyPlan, UserAnswer } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, CheckCircle, Circle, Edit2, Save, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

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

export default function ViewStudyPlanPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [editingWeek, setEditingWeek] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('id');

        if (!planId) {
          navigate(createPageUrl('StudyPlans'));
          return;
        }

        const planData = await StudyPlan.read(planId);
        setPlan(planData);

        // Carregar respostas do usuário
        const answers = await UserAnswer.filter({ created_by: planData.created_by }, '-created_date', 2000);
        setUserAnswers(answers);

        // Calcular progresso por semana
        if (planData.schedule && planData.schedule.length > 0) {
          const progress = {};
          
          planData.schedule.forEach((week) => {
            const weekStart = new Date(week.start_date);
            const weekEnd = new Date(week.end_date);

            const weekAnswers = answers.filter(a => {
              const answerDate = new Date(a.created_date);
              return answerDate >= weekStart && answerDate <= weekEnd;
            });

            const correct = weekAnswers.filter(a => a.is_correct).length;
            const accuracy = weekAnswers.length > 0 ? Math.round((correct / weekAnswers.length) * 100) : 0;

            progress[week.week] = {
              questions: weekAnswers.length,
              correct: correct,
              accuracy: accuracy,
              targetQuestions: week.target_questions
            };
          });

          setWeeklyProgress(progress);
        }
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleDeletePlan = async () => {
    if (confirm('Tem certeza que deseja deletar este plano?')) {
      try {
        await StudyPlan.delete(plan.id);
        navigate(createPageUrl('StudyPlans'));
      } catch (error) {
        console.error('Erro ao deletar plano:', error);
        alert('Erro ao deletar plano');
      }
    }
  };

  const startEditingWeek = (week) => {
    setEditingWeek(week.week);
    setEditData({
      start_date: week.start_date,
      end_date: week.end_date,
      target_questions: week.target_questions,
      target_hours: week.target_hours
    });
  };

  const saveWeekEdit = async () => {
    try {
      const updatedSchedule = plan.schedule.map(w =>
        w.week === editingWeek
          ? { ...w, ...editData }
          : w
      );

      await StudyPlan.update(plan.id, { schedule: updatedSchedule });
      setPlan({ ...plan, schedule: updatedSchedule });
      setEditingWeek(null);
      alert('Semana atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar semana:', error);
      alert('Erro ao salvar alterações');
    }
  };

  const calculateOverallProgress = () => {
    if (!plan || !plan.schedule) return 0;
    return Math.round(((plan.progress?.current_week || 1) / plan.schedule.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Plano não encontrado</p>
          <Link to={createPageUrl('StudyPlans')}>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('StudyPlans')}>
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{plan.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {plan.schedule && plan.schedule.length} semanas | {plan.subjects.length} disciplinas
              </p>
            </div>
            <Button
              onClick={handleDeletePlan}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Deletar
            </Button>
          </div>
        </div>

        {/* Resumo Geral */}
        <Card className="dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  {plan.status === 'active' ? 'Ativo' : plan.status === 'completed' ? 'Completo' : 'Pausado'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Semana Atual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {plan.progress?.current_week || 1}/{plan.schedule?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questões Respondidas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {plan.progress?.questions_answered || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Horas Estudadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {plan.progress?.hours_studied || 0}h
                </p>
              </div>
            </div>

            {/* Progresso Geral */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</p>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Plano */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">De</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(plan.start_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Até</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(plan.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Metas Semanais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questões por Semana</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.weekly_goals.questions_per_week}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Horas por Semana</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.weekly_goals.study_hours_per_week}h
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disciplinas */}
        <Card className="dark:bg-gray-800 mb-6">
          <CardHeader>
            <CardTitle>Disciplinas do Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plan.subjects.map((subject) => (
                <Badge key={subject} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  {SUBJECT_LABELS[subject] || subject}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cronograma Detalhado */}
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Cronograma Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.schedule && plan.schedule.map((week) => {
                const progress = weeklyProgress[week.week] || { questions: 0, correct: 0, accuracy: 0, targetQuestions: 0 };
                const isCurrentWeek = (plan.progress?.current_week || 1) === week.week;
                const isCompleted = (plan.progress?.current_week || 1) > week.week;

                return (
                  <div
                    key={week.week}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentWeek
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : isCompleted
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : isCurrentWeek ? (
                            <Circle className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg ${isCurrentWeek ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                            Semana {week.week}
                            {isCurrentWeek && <span className="ml-2 text-sm">(Atual)</span>}
                            {isCompleted && <span className="ml-2 text-sm">(Completo)</span>}
                          </h4>
                          {editingWeek === week.week ? (
                            <div className="space-y-2 mt-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="date"
                                  value={editData.start_date}
                                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                                  className="text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                />
                                <Input
                                  type="date"
                                  value={editData.end_date}
                                  onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                                  className="text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(week.start_date).toLocaleDateString('pt-BR')} - {new Date(week.end_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      {editingWeek !== week.week && (
                        <button
                          onClick={() => startEditingWeek(week)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Metas e Progresso */}
                    <div className="ml-9 space-y-3">
                      {editingWeek === week.week ? (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Questões</label>
                            <Input
                              type="number"
                              min="1"
                              value={editData.target_questions}
                              onChange={(e) => setEditData({ ...editData, target_questions: parseInt(e.target.value) || 0 })}
                              className="text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Horas</label>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={editData.target_hours}
                              onChange={(e) => setEditData({ ...editData, target_hours: parseFloat(e.target.value) || 0 })}
                              className="text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Questões</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {progress.questions}/{progress.targetQuestions}
                            </p>
                            <Progress
                              value={Math.min((progress.questions / progress.targetQuestions) * 100, 100)}
                              className="h-1.5 mt-1"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa de Acerto</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {progress.accuracy}%
                            </p>
                            {progress.accuracy > 0 && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {progress.correct}/{progress.questions} acertos
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Disciplinas da Semana */}
                      {week.subjects_focus && week.subjects_focus.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Foco desta semana:</p>
                          <div className="flex flex-wrap gap-1">
                            {week.subjects_focus.map((subject) => (
                              <Badge
                                key={subject}
                                variant="outline"
                                className={`text-xs ${
                                  isCurrentWeek
                                    ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                    : 'dark:border-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {SUBJECT_LABELS[subject] || subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}