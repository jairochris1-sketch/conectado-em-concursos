import { useState, useEffect } from 'react';
import { User, StudyPlan, UserExamDate } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { addWeeks, format, eachWeekOfInterval } from 'date-fns';

const SUBJECT_OPTIONS = [
  'portugues',
  'matematica',
  'direito_constitucional',
  'direito_administrativo',
  'direito_penal',
  'direito_civil',
  'informatica',
  'conhecimentos_gerais',
  'raciocinio_logico',
  'contabilidade',
  'pedagogia'
];

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

export default function CreateStudyPlanPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examDates, setExamDates] = useState([]);
  const [schedule, setSchedule] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    subjects: [],
    weekly_goals: {
      questions_per_week: 20,
      study_hours_per_week: 10
    },
    target_exam_dates: [],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addWeeks(new Date(), 12), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        const userExamDates = await UserExamDate.filter({}, '-exam_date', 50);
        const filteredDates = userExamDates.filter(d => d.created_by === userData.email && new Date(d.exam_date) >= new Date());
        setExamDates(filteredDates);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generateSchedule = () => {
    if (!formData.start_date || !formData.end_date || formData.subjects.length === 0) {
      alert('Preencha as datas e selecione ao menos uma disciplina');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });

    const newSchedule = weeks.map((weekStart, index) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Distribuir disciplinas de forma equilibrada ao longo das semanas
      const subjectIndex = index % formData.subjects.length;
      const focusSubjects = formData.subjects;

      return {
        week: index + 1,
        start_date: format(weekStart, 'yyyy-MM-dd'),
        end_date: format(weekEnd, 'yyyy-MM-dd'),
        subjects_focus: focusSubjects,
        target_questions: formData.weekly_goals.questions_per_week,
        target_hours: formData.weekly_goals.study_hours_per_week
      };
    });

    setSchedule(newSchedule);
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleExamDateToggle = (dateId) => {
    setFormData(prev => ({
      ...prev,
      target_exam_dates: prev.target_exam_dates.includes(dateId)
        ? prev.target_exam_dates.filter(d => d !== dateId)
        : [...prev.target_exam_dates, dateId]
    }));
  };

  const handleSavePlan = async () => {
    if (!formData.name || formData.subjects.length === 0 || schedule.length === 0) {
      alert('Preencha todos os campos e gere o cronograma');
      return;
    }

    try {
      await StudyPlan.create({
        name: formData.name,
        subjects: formData.subjects,
        weekly_goals: formData.weekly_goals,
        target_exam_dates: formData.target_exam_dates,
        schedule: schedule,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'active',
        progress: {
          questions_answered: 0,
          hours_studied: 0,
          current_week: 1
        }
      });

      alert('Plano de estudo criado com sucesso!');
      navigate(createPageUrl('StudyPlans'));
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano de estudo');
    }
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('StudyPlans')}>
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Criar Plano de Estudo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Crie um plano personalizado baseado em suas metas e datas de provas</p>
        </div>

        <div className="space-y-6">
          {/* Nome do Plano */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Nome do Plano</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Preparação ENEM 2024"
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Período do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Data de Início</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Data de Término</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disciplinas */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Disciplinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUBJECT_OPTIONS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectToggle(subject)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.subjects.includes(subject)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-indigo-400'
                    }`}
                  >
                    {SUBJECT_LABELS[subject]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metas Semanais */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Metas Semanais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Questões por Semana</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.weekly_goals.questions_per_week}
                    onChange={(e) => setFormData({
                      ...formData,
                      weekly_goals: {
                        ...formData.weekly_goals,
                        questions_per_week: parseInt(e.target.value) || 0
                      }
                    })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Horas de Estudo por Semana</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.weekly_goals.study_hours_per_week}
                    onChange={(e) => setFormData({
                      ...formData,
                      weekly_goals: {
                        ...formData.weekly_goals,
                        study_hours_per_week: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas de Provas */}
          {examDates.length > 0 && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Datas de Provas (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {examDates.map((date) => (
                    <label key={date.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.target_exam_dates.includes(date.id)}
                        onChange={() => handleExamDateToggle(date.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{date.exam_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(date.exam_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gerar Cronograma */}
          <Button
            onClick={generateSchedule}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg gap-2"
          >
            <Plus className="w-5 h-5" />
            Gerar Cronograma
          </Button>

          {/* Preview do Cronograma */}
          {schedule.length > 0 && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Cronograma Sugerido ({schedule.length} semanas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {schedule.map((week) => (
                    <div key={week.week} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Semana {week.week}</h4>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(week.start_date).toLocaleDateString('pt-BR')} a {new Date(week.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          📚 <strong>{week.target_questions} questões</strong> | ⏱️ <strong>{week.target_hours}h de estudo</strong>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {week.subjects_focus.map((subject) => (
                            <Badge key={subject} variant="secondary" className="dark:bg-gray-600 dark:text-white">
                              {SUBJECT_LABELS[subject]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Link to={createPageUrl('StudyPlans')} className="flex-1">
              <Button variant="outline" className="w-full dark:border-gray-600 dark:text-white">
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleSavePlan}
              disabled={schedule.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              Criar Plano
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}