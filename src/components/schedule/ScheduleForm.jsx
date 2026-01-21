import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

const daysOfWeek = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" }
];

const subjects = [
  "Português",
  "Matemática",
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Penal",
  "Informática",
  "Conhecimentos Gerais"
];

const activities = [
  { value: "teoria", label: "Teoria" },
  { value: "questoes", label: "Questões" },
  { value: "revisao", label: "Revisão" },
  { value: "simulado", label: "Simulado" }
];

export default function ScheduleForm({ schedule, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(schedule || {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    schedule_items: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule_items: [
        ...prev.schedule_items,
        {
          day_of_week: "monday",
          start_time: "09:00",
          end_time: "10:00",
          subject: "",
          topic: "",
          activity_type: "teoria"
        }
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
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          {schedule ? 'Editar Cronograma' : 'Novo Cronograma'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Cronograma de Janeiro"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Horários de Estudo</h3>
              <Button type="button" onClick={addScheduleItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Horário
              </Button>
            </div>

            <div className="space-y-4">
              {formData.schedule_items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Dia da Semana</Label>
                      <Select
                        value={item.day_of_week}
                        onValueChange={(value) => updateScheduleItem(index, 'day_of_week', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={item.start_time}
                        onChange={(e) => updateScheduleItem(index, 'start_time', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={item.end_time}
                        onChange={(e) => updateScheduleItem(index, 'end_time', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Disciplina</Label>
                      <Select
                        value={item.subject}
                        onValueChange={(value) => updateScheduleItem(index, 'subject', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Atividade</Label>
                      <Select
                        value={item.activity_type}
                        onValueChange={(value) => updateScheduleItem(index, 'activity_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map(activity => (
                            <SelectItem key={activity.value} value={activity.value}>
                              {activity.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeScheduleItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Tópico/Assunto</Label>
                    <Input
                      value={item.topic}
                      onChange={(e) => updateScheduleItem(index, 'topic', e.target.value)}
                      placeholder="Ex: Regência Verbal, Juros Compostos..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {schedule ? 'Atualizar' : 'Criar'} Cronograma
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}