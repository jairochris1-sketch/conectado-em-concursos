import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Clock, Target, CalendarDays, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudySession } from '@/entities/StudySession';

export default function StudySessions({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    start_time: '',
    end_time: '',
    subject: '',
    color: 'blue',
    status: 'scheduled'
  });

  const dailyGoalHours = user?.study_hours_per_day || 2;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allSessions = await StudySession.filter({ user_email: user.email }, '-start_time', 200);
      setSessions(allSessions);
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const now = new Date();
    // Default to next hour
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    
    const end = new Date(now);
    end.setHours(end.getHours() + 1);

    const formatDt = (d) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      title: '',
      start_time: formatDt(now),
      end_time: formatDt(end),
      subject: '',
      color: 'blue',
      status: 'scheduled'
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...formData,
        user_email: user.email,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (editingId) {
        await StudySession.update(editingId, payload);
      } else {
        await StudySession.create(payload);
      }
      setOpenDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar a sessão');
    }
  };

  const handleEdit = (session) => {
    const formatDt = (d) => {
      const dt = new Date(d);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      return new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      title: session.title,
      start_time: formatDt(session.start_time),
      end_time: formatDt(session.end_time),
      subject: session.subject || '',
      color: session.color || 'blue',
      status: session.status || 'scheduled'
    });
    setEditingId(session.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar?')) {
      try {
        await StudySession.delete(id);
        loadData();
      } catch (error) {
        alert('Erro ao deletar');
      }
    }
  };

  const toggleStatus = async (session) => {
    const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
    try {
      await StudySession.update(session.id, { status: newStatus });
      setSessions(sessions.map(s => s.id === session.id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error(error);
    }
  };

  // Progress logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySessions = sessions.filter(s => {
    const dt = new Date(s.start_time);
    dt.setHours(0,0,0,0);
    return dt.getTime() === today.getTime();
  });

  const completedTodayMs = todaySessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (new Date(s.end_time) - new Date(s.start_time)), 0);
  
  const completedTodayHours = completedTodayMs / (1000 * 60 * 60);
  const progressPercent = Math.min(100, Math.round((completedTodayHours / dailyGoalHours) * 100)) || 0;

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-none shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm">
            <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Meta Diária de Estudo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{completedTodayHours.toFixed(1)} de {dailyGoalHours} horas concluídas hoje</p>
              </div>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {progressPercent >= 100 && (
              <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                <Award className="w-4 h-4" /> Meta atingida! Excelente trabalho!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> Minhas Sessões
        </h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Agendar Sessão
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Sessão' : 'Nova Sessão de Estudo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Revisão de Constitucional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Início</label>
                  <Input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fim</label>
                  <Input type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disciplina (opcional)</label>
                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Ex: Direito Constitucional" />
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="missed">Perdida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma sessão agendada.</p>
        ) : (
          sessions.map(session => (
            <Card key={session.id} className={`dark:bg-gray-800 ${session.status === 'completed' ? 'opacity-75 border-green-200' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <button onClick={() => toggleStatus(session)} className="flex-shrink-0 text-gray-400 hover:text-green-600 transition-colors">
                  {session.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${session.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.start_time).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(session.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {session.subject && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{session.subject}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(session)} className="text-blue-600"><Edit2 className="w-4 h-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(session.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}