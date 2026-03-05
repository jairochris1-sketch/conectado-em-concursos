import { useState, useEffect } from "react";
import { StudySchedule } from "@/entities/StudySchedule";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Printer, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ScheduleForm from "../components/schedule/ScheduleForm";
import ScheduleView from "../components/schedule/ScheduleView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term
  const [activeTab, setActiveTab] = useState("all");

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

  const handleSubmit = async (scheduleData) => {
    try {
      if (editingSchedule) {
        await StudySchedule.update(editingSchedule.id, scheduleData);
      } else {
        await StudySchedule.create(scheduleData);
      }
      setShowForm(false);
      setEditingSchedule(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar cronograma:", error);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
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
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cronograma de Estudos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize seus estudos com horários personalizados
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Cronograma
          </Button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Modo "Hoje"
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Todos os Cronogramas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-900 mb-2">Suas Tarefas de Hoje</h2>
                <p className="text-gray-600">O que você tem planejado para hoje de acordo com seus cronogramas ativos.</p>
              </div>
              
              {/* Calcula os itens de hoje baseados nos cronogramas */}
              {(() => {
                const today = new Date();
                const dayNameMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDayOfWeek = dayNameMap[today.getDay()];
                
                const todayItems = schedules
                  .flatMap(s => s.schedule_items.map(i => ({ ...i, scheduleTitle: s.title })))
                  .filter(item => item.day_of_week === currentDayOfWeek)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                if (todayItems.length === 0) {
                  return (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 font-medium">Nenhum bloco de estudo programado para hoje.</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab('all')}>Ver todos os cronogramas</Button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {todayItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-lg text-center min-w-[120px]">
                          {item.start_time} - {item.end_time}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">{item.subject}</h4>
                          {item.topic && <p className="text-gray-600 text-sm mt-1">{item.topic}</p>}
                          <p className="text-xs text-gray-400 mt-2">Cronograma: {item.scheduleTitle}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="bg-gray-50 uppercase tracking-wider text-[10px]">
                            {item.activity_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Card>
          </TabsContent>

          <TabsContent value="all">
            {/* Search Input for filtering schedules */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Pesquisar cronogramas por título ou descrição..."
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <ScheduleForm
                  schedule={editingSchedule}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingSchedule(null);
                  }}
                />
              </motion.div>
            )}

            <div className="grid gap-6">
              {filteredSchedules.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <Calendar className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {schedules.length === 0 && searchTerm === ""
                        ? "Nenhum cronograma criado"
                        : "Nenhum cronograma encontrado"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
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
                    <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl text-gray-900 dark:text-white">
                              {schedule.title}
                            </CardTitle>
                            {schedule.description && (
                              <p className="text-gray-600 dark:text-gray-400 mt-2">{schedule.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(schedule.start_date).toLocaleDateString('pt-BR')} - {new Date(schedule.end_date).toLocaleDateString('pt-BR')}
                              </span>
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
                              Editar
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
                        <ScheduleView schedule={schedule} />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}