import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Wand2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const daysOfWeek = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" }
];

const activities = [
  { value: "teoria", label: "Teoria" },
  { value: "questoes", label: "Questões" },
  { value: "revisao", label: "Revisão" },
  { value: "simulado", label: "Simulado" }
];

export default function ScheduleForm({ schedule, onSubmit, onCancel }) {
  const [activeTab, setActiveTab] = useState(schedule ? "manual" : "auto");
  const [subjects, setSubjects] = useState([]);
  
  // Manual form
  const [formData, setFormData] = useState(schedule || {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    schedule_items: []
  });

  // Auto form
  const [autoConfig, setAutoConfig] = useState({
    title: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
    selectedSubjects: [],
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    hoursPerDay: 4,
    startTime: "08:00"
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await base44.entities.Subject.list();
        setSubjects(data);
      } catch (e) {
        console.error("Erro ao buscar disciplinas:", e);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubmitManual = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGenerateAuto = () => {
    if (!autoConfig.title) {
      alert("Defina um título para o cronograma.");
      return;
    }
    if (autoConfig.selectedSubjects.length === 0) {
      alert("Selecione pelo menos uma disciplina.");
      return;
    }
    if (autoConfig.availableDays.length === 0) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }

    const newItems = [];
    const subjectsList = [...autoConfig.selectedSubjects];
    let subjectIndex = 0;

    autoConfig.availableDays.forEach(day => {
      let [currentHour, currentMinute] = autoConfig.startTime.split(':').map(Number);
      
      for (let i = 0; i < autoConfig.hoursPerDay; i++) {
        const start = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        currentHour += 1;
        const end = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        // Distribute subjects circularly
        const subj = subjectsList[subjectIndex % subjectsList.length];
        subjectIndex++;

        // Add some variety (revision/questions) every 3-4 blocks
        let activity = "teoria";
        if (subjectIndex % 5 === 0) activity = "revisao";
        else if (subjectIndex % 3 === 0) activity = "questoes";

        newItems.push({
          day_of_week: day,
          start_time: start,
          end_time: end,
          subject: subj.label,
          topic: "Estudo contínuo",
          activity_type: activity
        });
      }
    });

    const newSchedule = {
      title: autoConfig.title,
      description: "Cronograma adaptativo gerado automaticamente.",
      start_date: autoConfig.start_date,
      end_date: autoConfig.end_date,
      schedule_items: newItems
    };

    onSubmit(newSchedule);
  };

  const toggleAutoSubject = (subject) => {
    setAutoConfig(prev => {
      const exists = prev.selectedSubjects.find(s => s.value === subject.value);
      if (exists) {
        return { ...prev, selectedSubjects: prev.selectedSubjects.filter(s => s.value !== subject.value) };
      } else {
        return { ...prev, selectedSubjects: [...prev.selectedSubjects, subject] };
      }
    });
  };

  const toggleAutoDay = (dayValue) => {
    setAutoConfig(prev => {
      const exists = prev.availableDays.includes(dayValue);
      if (exists) {
        return { ...prev, availableDays: prev.availableDays.filter(d => d !== dayValue) };
      } else {
        return { ...prev, availableDays: [...prev.availableDays, dayValue] };
      }
    });
  };

  // --- MANUAL FORM HELPERS ---
  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule_items: [
        ...prev.schedule_items,
        { day_of_week: "monday", start_time: "09:00", end_time: "10:00", subject: "", topic: "", activity_type: "teoria" }
      ]
    }));
  };

  const removeScheduleItem = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule_items: prev.schedule_items.filter((_, i) => i !== index)
    }));
  };

  const updateScheduleItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule_items: prev.schedule_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-gray-200">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-2">
          {schedule ? 'Editar Cronograma' : 'Novo Cronograma de Estudos'}
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!schedule && (
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="flex gap-2">
                <Wand2 className="w-4 h-4" /> Gerador Inteligente
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex gap-2">
                <CalendarIcon className="w-4 h-4" /> Montar Manualmente
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="auto">
          <CardContent className="pt-6 space-y-8">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                <Wand2 className="w-5 h-5 text-indigo-600" /> Como funciona?
              </h3>
              <p className="text-sm text-indigo-700">
                Selecione as disciplinas que deseja estudar e sua disponibilidade. O sistema criará um cronograma visual balanceado e adaptativo automaticamente, alternando as matérias para evitar fadiga mental.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Título do Cronograma</Label>
                <Input
                  value={autoConfig.title}
                  onChange={(e) => setAutoConfig({...autoConfig, title: e.target.value})}
                  placeholder="Ex: Ciclo Pré-Edital INSS"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Data de Início</Label>
                  <Input type="date" value={autoConfig.start_date} onChange={(e) => setAutoConfig({...autoConfig, start_date: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <Label>Data de Fim (Prova)</Label>
                  <Input type="date" value={autoConfig.end_date} onChange={(e) => setAutoConfig({...autoConfig, end_date: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Disciplinas a Estudar</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <Badge 
                    key={subject.value}
                    variant={autoConfig.selectedSubjects.find(s => s.value === subject.value) ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm ${autoConfig.selectedSubjects.find(s => s.value === subject.value) ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-gray-100'}`}
                    onClick={() => toggleAutoSubject(subject)}
                  >
                    {subject.label}
                  </Badge>
                ))}
                {subjects.length === 0 && <span className="text-sm text-gray-500">Nenhuma disciplina cadastrada no sistema.</span>}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Dias Disponíveis na Semana</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <Badge 
                    key={day.value}
                    variant={autoConfig.availableDays.includes(day.value) ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 ${autoConfig.availableDays.includes(day.value) ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-100'}`}
                    onClick={() => toggleAutoDay(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Horas de Estudo por Dia: <span className="text-indigo-600 font-bold">{autoConfig.hoursPerDay}h</span>
                </Label>
                <Slider
                  value={[autoConfig.hoursPerDay]}
                  min={1}
                  max={12}
                  step={1}
                  onValueChange={(vals) => setAutoConfig({...autoConfig, hoursPerDay: vals[0]})}
                  className="py-4"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Horário de Início (Aproximado)</Label>
                <Input 
                  type="time" 
                  value={autoConfig.startTime} 
                  onChange={(e) => setAutoConfig({...autoConfig, startTime: e.target.value})}
                  className="w-full md:w-1/2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
              <Button onClick={handleGenerateAuto} className="bg-indigo-600 hover:bg-indigo-700">
                <Wand2 className="w-4 h-4 mr-2" /> Gerar Cronograma Inteligente
              </Button>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="manual">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmitManual} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Fim</Label>
                  <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} required />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Blocos de Estudo (Aulas/Atividades)</h3>
                  <Button type="button" onClick={addScheduleItem} size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Bloco
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.schedule_items.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-wrap md:flex-nowrap gap-4 items-end">
                      <div className="w-full md:w-auto flex-1">
                        <Label className="text-xs mb-1 block">Dia da Semana</Label>
                        <Select value={item.day_of_week} onValueChange={(value) => updateScheduleItem(index, 'day_of_week', value)}>
                          <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map(day => (<SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-1/2 md:w-24">
                        <Label className="text-xs mb-1 block">Início</Label>
                        <Input type="time" value={item.start_time} onChange={(e) => updateScheduleItem(index, 'start_time', e.target.value)} className="bg-white" />
                      </div>
                      <div className="w-1/2 md:w-24">
                        <Label className="text-xs mb-1 block">Fim</Label>
                        <Input type="time" value={item.end_time} onChange={(e) => updateScheduleItem(index, 'end_time', e.target.value)} className="bg-white" />
                      </div>
                      <div className="w-full md:w-auto flex-[1.5]">
                        <Label className="text-xs mb-1 block">Disciplina</Label>
                        <Select value={item.subject} onValueChange={(value) => updateScheduleItem(index, 'subject', value)}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (<SelectItem key={subject.value} value={subject.label}>{subject.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full md:w-auto flex-1">
                        <Label className="text-xs mb-1 block">Atividade</Label>
                        <Select value={item.activity_type} onValueChange={(value) => updateScheduleItem(index, 'activity_type', value)}>
                          <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {activities.map(activity => (<SelectItem key={activity.value} value={activity.value}>{activity.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeScheduleItem(index)} className="shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.schedule_items.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm border border-dashed rounded-lg">
                      Nenhum bloco de estudo adicionado.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {schedule ? 'Salvar Alterações' : 'Salvar Cronograma'}
                </Button>
              </div>
            </form>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}