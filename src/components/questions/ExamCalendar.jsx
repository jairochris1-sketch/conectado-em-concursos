import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const colorOptions = [
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
];

export default function ExamCalendar() {
  const [isOpen, setIsOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    exam_name: "",
    exam_date: "",
    description: "",
    color: "blue",
    reminder_days: 7,
  });

  useEffect(() => {
    if (isOpen) {
      loadExams();
    }
  }, [isOpen]);

  const loadExams = async () => {
    try {
      const data = await base44.entities.UserExamDate.list("-exam_date");
      setExams(data);
    } catch (error) {
      console.error("Erro ao carregar provas:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await base44.entities.UserExamDate.update(editingExam.id, formData);
        toast.success("Prova atualizada com sucesso!");
      } else {
        await base44.entities.UserExamDate.create(formData);
        toast.success("Prova adicionada ao calendário!");
      }
      loadExams();
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar prova");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja realmente excluir esta prova?")) {
      try {
        await base44.entities.UserExamDate.delete(id);
        toast.success("Prova removida do calendário");
        loadExams();
      } catch (error) {
        toast.error("Erro ao excluir prova");
      }
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      exam_date: exam.exam_date,
      description: exam.description || "",
      color: exam.color || "blue",
      reminder_days: exam.reminder_days || 7,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      exam_name: "",
      exam_date: "",
      description: "",
      color: "blue",
      reminder_days: 7,
    });
    setEditingExam(null);
    setShowForm(false);
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateString);
    examDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getColorClass = (color, type = "bg") => {
    const colors = {
      red: type === "bg" ? "bg-red-500" : "text-red-500",
      blue: type === "bg" ? "bg-blue-500" : "text-blue-500",
      green: type === "bg" ? "bg-green-500" : "text-green-500",
      yellow: type === "bg" ? "bg-yellow-500" : "text-yellow-500",
      purple: type === "bg" ? "bg-purple-500" : "text-purple-500",
      pink: type === "bg" ? "bg-pink-500" : "text-pink-500",
      orange: type === "bg" ? "bg-orange-500" : "text-orange-500",
    };
    return colors[color] || colors.blue;
  };

  const upcomingExams = exams.filter((exam) => getDaysUntil(exam.exam_date) >= 0);
  const pastExams = exams.filter((exam) => getDaysUntil(exam.exam_date) < 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 relative"
      >
        <CalendarIcon className="w-5 h-5" />
        {upcomingExams.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
            {upcomingExams.length}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Calendário de Provas
            </DialogTitle>
            <DialogDescription>
              Organize as datas das suas provas e concursos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!showForm ? (
              <>
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Nova Prova
                </Button>

                {upcomingExams.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Próximas Provas
                    </h3>
                    <div className="space-y-2">
                      {upcomingExams.map((exam) => {
                        const daysUntil = getDaysUntil(exam.exam_date);
                        return (
                          <div
                            key={exam.id}
                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-3 h-3 rounded-full ${getColorClass(exam.color)} mt-1.5 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {exam.exam_name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {format(new Date(exam.exam_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </p>
                                  {exam.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                      {exam.description}
                                    </p>
                                  )}
                                  <div className="mt-2">
                                    {daysUntil === 0 ? (
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                                        🔥 HOJE!
                                      </span>
                                    ) : daysUntil === 1 ? (
                                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">
                                        ⏰ Amanhã
                                      </span>
                                    ) : daysUntil <= 7 ? (
                                      <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                        ⚡ {daysUntil} dias
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        📅 {daysUntil} dias
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(exam)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(exam.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastExams.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      Provas Realizadas
                    </h3>
                    <div className="space-y-2 opacity-60">
                      {pastExams.map((exam) => (
                        <div
                          key={exam.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-3 h-3 rounded-full ${getColorClass(exam.color)}`} />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {exam.exam_name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  {format(new Date(exam.exam_date), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(exam.id)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exams.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma prova cadastrada ainda.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Adicione as datas das suas provas para organizar seus estudos!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {editingExam ? "Editar Prova" : "Nova Prova"}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <Label htmlFor="exam_name">Nome da Prova *</Label>
                  <Input
                    id="exam_name"
                    value={formData.exam_name}
                    onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                    placeholder="Ex: Concurso TRT - Técnico Judiciário"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="exam_date">Data da Prova *</Label>
                  <Input
                    id="exam_date"
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Observações</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Prova às 14h, levar documento com foto"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Cor de Identificação</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-full ${color.class} ${
                          formData.color === color.value
                            ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
                            : ""
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingExam ? "Atualizar" : "Adicionar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}