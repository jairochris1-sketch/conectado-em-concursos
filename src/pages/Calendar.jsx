import React, { useEffect, useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Calendar as CalendarIcon, Plus, Edit2, Trash2, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User, UserExamDate } from '@/entities/all';
import { StudySession } from '@/entities/StudySession';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exam Form
  const [openExamDialog, setOpenExamDialog] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examFormData, setExamFormData] = useState({
    exam_name: '', exam_date: '', description: '', color: 'blue', reminder_days: 7
  });

  // Session Form
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionFormData, setSessionFormData] = useState({
    title: '', start_time: '', end_time: '', subject: '', status: 'scheduled'
  });

  const dailyGoalHours = user?.study_hours_per_day || 2;

  const colorMap = {
    red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
    green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
    pink: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-800',
    orange: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800'
  };

  const colorDotMap = {
    red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500',
    purple: 'bg-purple-500', pink: 'bg-pink-500', orange: 'bg-orange-500'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      const [userExams, userSessions] = await Promise.all([
        UserExamDate.filter({ created_by: userData.email }, '-exam_date', 100),
        StudySession.filter({ user_email: userData.email }, '-start_time', 200)
      ]);
      setExams(userExams);
      setSessions(userSessions);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Exam Actions ---
  const resetExamForm = () => {
    setExamFormData({ exam_name: '', exam_date: '', description: '', color: 'blue', reminder_days: 7 });
    setEditingExamId(null);
  };

  const handleSaveExam = async () => {
    if (!examFormData.exam_name || !examFormData.exam_date) return alert('Preencha o nome e a data');
    try {
      if (editingExamId) {
        await UserExamDate.update(editingExamId, examFormData);
      } else {
        await UserExamDate.create(examFormData);
      }
      setOpenExamDialog(false);
      resetExamForm();
      loadData();
    } catch (error) {
      alert('Erro ao salvar a data');
    }
  };

  const handleEditExam = (date) => {
    setExamFormData({
      exam_name: date.exam_name, exam_date: date.exam_date, description: date.description || '', color: date.color || 'blue', reminder_days: date.reminder_days || 7
    });
    setEditingExamId(date.id);
    setOpenExamDialog(true);
  };

  const handleDeleteExam = async (id) => {
    if (confirm('Deletar esta data?')) {
      await UserExamDate.delete(id);
      loadData();
      setOpenExamDialog(false);
    }
  };

  // --- Session Actions ---
  const formatDtForInput = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const resetSessionForm = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    
    setSessionFormData({
      title: '', start_time: formatDtForInput(now), end_time: formatDtForInput(end), subject: '', status: 'scheduled'
    });
    setEditingSessionId(null);
  };

  const handleSaveSession = async () => {
    if (!sessionFormData.title || !sessionFormData.start_time || !sessionFormData.end_time) return alert('Preencha os campos obrigatórios');
    try {
      const payload = {
        ...sessionFormData,
        user_email: user.email,
        start_time: new Date(sessionFormData.start_time).toISOString(),
        end_time: new Date(sessionFormData.end_time).toISOString(),
      };
      if (editingSessionId) {
        await StudySession.update(editingSessionId, payload);
      } else {
        await StudySession.create(payload);
      }
      setOpenSessionDialog(false);
      resetSessionForm();
      loadData();
    } catch (error) {
      alert('Erro ao salvar a sessão');
    }
  };

  const handleEditSession = (session) => {
    setSessionFormData({
      title: session.title, start_time: formatDtForInput(new Date(session.start_time)), end_time: formatDtForInput(new Date(session.end_time)), subject: session.subject || '', status: session.status || 'scheduled'
    });
    setEditingSessionId(session.id);
    setOpenSessionDialog(true);
  };

  const handleDeleteSession = async (id) => {
    if (confirm('Deletar sessão?')) {
      await StudySession.delete(id);
      loadData();
      setOpenSessionDialog(false);
    }
  };

  const toggleSessionStatus = async (session) => {
    const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    try {
      await StudySession.update(session.id, { status: newStatus });
      setSessions(sessions.map(s => s.id === session.id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error(error);
    }
  };

  // --- Calendar Grid ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h1>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => { resetSessionForm(); setOpenSessionDialog(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Sessão de Estudo
            </Button>
            <Button onClick={() => { resetExamForm(); setOpenExamDialog(true); }} variant="outline" className="gap-2 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400">
              <CalendarIcon className="w-4 h-4" /> Data de Prova
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div> Progresso Diário</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Meta Atingida</div>
          <div className="flex items-center gap-1"><Target className="w-4 h-4 text-blue-500" /> Provas/Editais</div>
          <div className="flex items-center gap-1"><Circle className="w-4 h-4 text-gray-400" /> Sessão Agendada</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sessão Concluída</div>
        </div>

        {/* Calendar Grid */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const dayExams = exams.filter(e => isSameDay(new Date(e.exam_date), day));
              const daySessions = sessions.filter(s => isSameDay(new Date(s.start_time), day)).sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
              
              // Progress
              const completedMs = daySessions
                .filter(s => s.status === 'completed')
                .reduce((acc, s) => acc + (new Date(s.end_time) - new Date(s.start_time)), 0);
              const completedHours = completedMs / (1000 * 60 * 60);
              const progressPercent = Math.min(100, Math.round((completedHours / dailyGoalHours) * 100)) || 0;

              return (
                <div key={i} className={`min-h-[140px] bg-white dark:bg-gray-800 p-1.5 md:p-2 flex flex-col gap-1 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/50 opacity-60' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300'}`}>
                      {format(day, 'd')}
                    </span>
                    {dailyGoalHours > 0 && daySessions.length > 0 && (
                      <div className="w-10 mt-1 md:w-16" title={`${completedHours.toFixed(1)} / ${dailyGoalHours}h`}>
                        <Progress value={progressPercent} className="h-1.5" indicatorClassName={progressPercent >= 100 ? 'bg-green-500' : 'bg-indigo-500'} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {/* Exams */}
                    {dayExams.map(exam => (
                      <div key={exam.id} onClick={() => handleEditExam(exam)} className={`text-[10px] md:text-xs px-1.5 py-1 rounded cursor-pointer border shadow-sm flex items-center gap-1 ${colorMap[exam.color] || colorMap.blue}`}>
                        <Target className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-medium">{exam.exam_name}</span>
                      </div>
                    ))}
                    {/* Sessions */}
                    {daySessions.map(session => (
                      <div key={session.id} className={`text-[10px] md:text-xs px-1.5 py-1 rounded flex items-center gap-1.5 border shadow-sm transition-colors ${session.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}>
                        <button onClick={(e) => { e.stopPropagation(); toggleSessionStatus(session); }} className="hover:scale-110 transition-transform flex-shrink-0">
                          {session.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500" />}
                        </button>
                        <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => handleEditSession(session)}>
                          <span className="font-semibold truncate leading-tight">{format(new Date(session.start_time), 'HH:mm')}</span>
                          <span className="truncate opacity-90 leading-tight">{session.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Dialogs */}
        <Dialog open={openExamDialog} onOpenChange={setOpenExamDialog}>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>{editingExamId ? 'Editar Prova/Concurso' : 'Nova Data de Prova'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Prova</label>
                <Input value={examFormData.exam_name} onChange={(e) => setExamFormData({ ...examFormData, exam_name: e.target.value })} placeholder="Ex: ENEM, Concurso ABC..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data da Prova</label>
                <Input type="date" value={examFormData.exam_date} onChange={(e) => setExamFormData({ ...examFormData, exam_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea value={examFormData.description} onChange={(e) => setExamFormData({ ...examFormData, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cor</label>
                  <Select value={examFormData.color} onValueChange={(value) => setExamFormData({ ...examFormData, color: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'].map(c => (
                        <SelectItem key={c} value={c}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colorDotMap[c]}`} />
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lembrete (dias)</label>
                  <Input type="number" min="0" value={examFormData.reminder_days} onChange={(e) => setExamFormData({ ...examFormData, reminder_days: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveExam} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">Salvar</Button>
                {editingExamId && (
                  <Button variant="destructive" onClick={() => handleDeleteExam(editingExamId)} size="icon"><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openSessionDialog} onOpenChange={setOpenSessionDialog}>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>{editingSessionId ? 'Editar Sessão de Estudo' : 'Nova Sessão de Estudo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input value={sessionFormData.title} onChange={e => setSessionFormData({...sessionFormData, title: e.target.value})} placeholder="Ex: Revisão de Constitucional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Início</label>
                  <Input type="datetime-local" value={sessionFormData.start_time} onChange={e => setSessionFormData({...sessionFormData, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fim</label>
                  <Input type="datetime-local" value={sessionFormData.end_time} onChange={e => setSessionFormData({...sessionFormData, end_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disciplina (opcional)</label>
                <Input value={sessionFormData.subject} onChange={e => setSessionFormData({...sessionFormData, subject: e.target.value})} placeholder="Ex: Direito Constitucional" />
              </div>
              {editingSessionId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={sessionFormData.status} onValueChange={v => setSessionFormData({...sessionFormData, status: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="missed">Perdida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveSession} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">Salvar</Button>
                {editingSessionId && (
                  <Button variant="destructive" onClick={() => handleDeleteSession(editingSessionId)} size="icon"><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}