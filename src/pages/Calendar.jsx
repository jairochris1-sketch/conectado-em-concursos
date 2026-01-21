import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
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
  DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserExamDate } from '@/entities/all';

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_date: '',
    description: '',
    color: 'blue',
    reminder_days: 7
  });

  const colorMap = {
    red: 'bg-red-100 text-red-800 border-red-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300'
  };

  const colorDotMap = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500'
  };

  // Carregar dados do usuário e suas datas
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        // Filtrar apenas as datas do usuário logado
        const userDates = await UserExamDate.filter({}, '-exam_date', 100);
        const filteredDates = userDates.filter(d => d.created_by === userData.email);
        setDates(filteredDates);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      exam_name: '',
      exam_date: '',
      description: '',
      color: 'blue',
      reminder_days: 7
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.exam_name || !formData.exam_date) {
      alert('Preencha o nome da prova e a data');
      return;
    }

    try {
      if (editingId) {
        await UserExamDate.update(editingId, formData);
        setDates(dates.map(d => d.id === editingId ? { ...d, ...formData } : d));
      } else {
        const newDate = await UserExamDate.create(formData);
        setDates([...dates, newDate]);
      }
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar a data');
    }
  };

  const handleEdit = (date) => {
    setFormData({
      exam_name: date.exam_name,
      exam_date: date.exam_date,
      description: date.description || '',
      color: date.color || 'blue',
      reminder_days: date.reminder_days || 7
    });
    setEditingId(date.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta data?')) {
      try {
        await UserExamDate.delete(id);
        setDates(dates.filter(d => d.id !== id));
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar');
      }
    }
  };

  const upcomingDates = dates
    .filter(d => new Date(d.exam_date) >= new Date())
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

  const pastDates = dates
    .filter(d => new Date(d.exam_date) < new Date())
    .sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));

  const daysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr);
    examDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));
    return diff;
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-10 h-10" />
              Meu Calendário de Provas
            </h1>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Data
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Data' : 'Adicionar Nova Data'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Prova</label>
                    <Input
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      placeholder="Ex: ENEM, Concurso ABC..."
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data da Prova</label>
                    <Input
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Observações sobre a prova..."
                      rows={3}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cor</label>
                      <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                        <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-white">
                          {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'].map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${colorDotMap[color]}`} />
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Lembrete (dias antes)</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.reminder_days}
                        onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 0 })}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setOpenDialog(false)} className="flex-1 dark:border-gray-600 dark:text-white">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas datas de provas e concursos</p>
        </div>

        {/* Próximas Provas */}
        {upcomingDates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Próximas Provas</h2>
            <div className="space-y-3">
              {upcomingDates.map((date) => {
                const days = daysUntil(date.exam_date);
                const isUrgent = days <= 7;

                return (
                  <Card key={date.id} className={`dark:bg-gray-800 dark:border-gray-700 border-l-4 ${colorMap[date.color].split(' ')[0]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{date.exam_name}</h3>
                            {isUrgent && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Urgente
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(date.exam_date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            Faltam {days} {days === 1 ? 'dia' : 'dias'}
                          </p>
                          {date.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{date.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(date)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(date.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Provas Passadas */}
        {pastDates.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Provas Realizadas</h2>
            <div className="space-y-3">
              {pastDates.map((date) => (
                <Card key={date.id} className="dark:bg-gray-800 dark:border-gray-700 opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 line-through">{date.exam_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(date.exam_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {date.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{date.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(date.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Vazio */}
        {dates.length === 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhuma data registrada ainda</p>
              <Button onClick={() => setOpenDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Adicionar Primeira Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}