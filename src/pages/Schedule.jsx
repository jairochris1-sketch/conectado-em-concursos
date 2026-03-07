import { useState, useEffect } from "react";
import { StudySchedule } from "@/entities/StudySchedule";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Printer, BookOpen, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import ScheduleWizard from "../components/schedule/ScheduleWizard";
import WeeklyBoard from "../components/schedule/WeeklyBoard";

const getDayName = (day) => {
  const days = {
    'monday': 'Segunda-feira',
    'tuesday': 'Terça-feira',
    'wednesday': 'Quarta-feira',
    'thursday': 'Quinta-feira',
    'friday': 'Sexta-feira',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };
  return days[day] || day;
};

const getActivityName = (activity) => {
  const activities = {
    'teoria': 'Teoria',
    'questoes': 'Questões',
    'revisao': 'Revisão',
    'simulado': 'Simulado'
  };
  return activities[activity] || activity;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); if (isNaN(d)) return null; d.setHours(0,0,0,0);
  return Math.floor((d - today) / (1000*60*60*24));
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [wizardInitial, setWizardInitial] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedulesData, userData] = await Promise.all([
        StudySchedule.list("-created_date"),
        User.me()
      ]);
      setSchedules(schedulesData);
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  // Gerado pelo Wizard; mantemos apenas o carregamento após concluir no componente filho.

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setWizardInitial(schedule);
    setShowWizard(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este cronograma?")) {
      try {
        await StudySchedule.delete(id);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir cronograma:", error);
      }
    }
  };

  const handleItemsChange = async (scheduleId, newItems) => {
    await StudySchedule.update(scheduleId, { schedule_items: newItems });
    loadData();
  };

  const handlePrint = (schedule) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cronograma de Estudos - ${schedule.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .schedule-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .day { font-weight: bold; color: #333; }
            .time { color: #666; }
            .subject { color: #2563eb; font-weight: bold; }
            .topic { color: #059669; }
            .activity { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cronograma de Estudos</h1>
            <h2>${schedule.title}</h2>
            <p><strong>Período:</strong> ${new Date(schedule.start_date).toLocaleDateString('pt-BR')} até ${new Date(schedule.end_date).toLocaleDateString('pt-BR')}</p>
            ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
          </div>

          <div class="schedule-content">
            ${schedule.schedule_items.map(item => `
              <div class="schedule-item">
                <div class="day">${getDayName(item.day_of_week)}</div>
                <div class="time">${item.start_time} - ${item.end_time}</div>
                <div class="subject">${item.subject}</div>
                <div class="topic">${item.topic}</div>
                <span class="activity">${getActivityName(item.activity_type)}</span>
              </div>
            `).join('')}
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter schedules based on search term
  const filteredSchedules = schedules.filter(schedule =>
    schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schedule.description && schedule.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()} aria-label="Voltar">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Cronograma de Estudos
              </h1>
              <p className="text-gray-600">
                Organize seus estudos com horários personalizados
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setWizardInitial(null); setShowWizard(true); }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Planejamento
          </Button>
        </motion.div>

        {/* Search Input for filtering schedules */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Pesquisar cronogramas por título ou descrição..."
            className="w-full p-3 border border-gray-200 rounded-md focus:ring-0 focus:border-gray-400 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showWizard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ScheduleWizard
              initialSchedule={wizardInitial}
              onClose={() => { setShowWizard(false); setWizardInitial(null); }}
              onComplete={() => { setShowWizard(false); setWizardInitial(null); loadData(); }}
            />
          </motion.div>
        )}

        <div className="grid gap-6">
          {filteredSchedules.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <Calendar className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {schedules.length === 0 && searchTerm === ""
                    ? "Nenhum cronograma criado"
                    : "Nenhum cronograma encontrado"}
                </h3>
                <p className="text-gray-600">
                  {schedules.length === 0 && searchTerm === ""
                    ? "Crie seu primeiro cronograma personalizado de estudos"
                    : "Ajuste os termos de busca para encontrar cronogramas."}
                </p>
                {schedules.length === 0 && searchTerm === "" && ( // Only show "Criar Cronograma" button if truly no schedules and no search term
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Cronograma
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredSchedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-sm border border-gray-200 bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {schedule.title}
                        </CardTitle>
                        {schedule.description && (
                          <p className="text-gray-600 mt-2">{schedule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(schedule.start_date).toLocaleDateString('pt-BR')} - {new Date(schedule.end_date).toLocaleDateString('pt-BR')}
                          </span>
                          {schedule.exam_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {(() => {
                                const d = daysUntil(schedule.exam_date);
                                if (d === null) return null;
                                return d > 0 ? `Prova em ${d} dias` : d === 0 ? 'Prova hoje' : `Prova há ${Math.abs(d)} dias`;
                              })()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {schedule.schedule_items.length} atividades
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(schedule)}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          Replanejar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <WeeklyBoard schedule={schedule} onChange={(items) => handleItemsChange(schedule.id, items)} />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}