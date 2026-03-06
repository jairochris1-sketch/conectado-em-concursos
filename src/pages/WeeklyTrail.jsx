import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, GripVertical, CheckCircle2, Trash, Edit2, Copy, RotateCcw, Target, BookOpen, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', 
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
];

export default function WeeklyTrail() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [trailModalOpen, setTrailModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  
  // Edit states
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTrail, setEditingTrail] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({ name: "", color: COLORS[0] });
  const [trailForm, setTrailForm] = useState({ name: "" });
  const [taskForm, setTaskForm] = useState({ title: "", subject_id: "none", duration_minutes: 30 });
  const [selectedDay, setSelectedDay] = useState("Segunda");
  
  // Selected Trail
  const [currentTrailIndex, setCurrentTrailIndex] = useState(0);

  // Initialization
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Queries
  const { data: subjects = [] } = useQuery({
    queryKey: ['weeklySubjects', user?.email],
    queryFn: () => base44.entities.WeeklySubject.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: trails = [], isSuccess: trailsLoaded } = useQuery({
    queryKey: ['weeklyTrails', user?.email],
    queryFn: async () => {
      const data = await base44.entities.WeeklyTrail.filter({ user_email: user.email });
      return data.sort((a, b) => a.order - b.order);
    },
    enabled: !!user?.email
  });

  const currentTrail = trails[currentTrailIndex] || trails[0] || null;

  const { data: tasks = [] } = useQuery({
    queryKey: ['weeklyTasks', currentTrail?.id],
    queryFn: () => base44.entities.WeeklyTrailTask.filter({ trail_id: currentTrail.id }),
    enabled: !!currentTrail?.id
  });

  const [optimisticTasks, setOptimisticTasks] = useState([]);
  useEffect(() => {
    setOptimisticTasks(tasks.sort((a, b) => a.order - b.order));
  }, [tasks]);

  // Mutations - Subjects
  const createSubject = useMutation({
    mutationFn: (data) => base44.entities.WeeklySubject.create({ ...data, user_email: user.email }),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklySubjects']}); setSubjectModalOpen(false); toast.success("Matéria criada!"); }
  });
  const updateSubject = useMutation({
    mutationFn: ({id, data}) => base44.entities.WeeklySubject.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklySubjects']}); setSubjectModalOpen(false); toast.success("Matéria atualizada!"); }
  });
  const deleteSubject = useMutation({
    mutationFn: (id) => base44.entities.WeeklySubject.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklySubjects']}); toast.success("Matéria excluída!"); }
  });

  // Mutations - Trails
  const createTrail = useMutation({
    mutationFn: async (data) => {
      const newOrder = trails.length > 0 ? Math.max(...trails.map(t => t.order)) + 1 : 0;
      return await base44.entities.WeeklyTrail.create({ ...data, user_email: user.email, order: newOrder });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({queryKey: ['weeklyTrails']}); 
      setTrailModalOpen(false); 
      setCurrentTrailIndex(trails.length);
      toast.success("Trilha criada!"); 
    }
  });
  const updateTrail = useMutation({
    mutationFn: ({id, data}) => base44.entities.WeeklyTrail.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklyTrails']}); setTrailModalOpen(false); toast.success("Trilha atualizada!"); }
  });
  const deleteTrail = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WeeklyTrail.delete(id);
      // Clean up tasks
      const trailTasks = await base44.entities.WeeklyTrailTask.filter({ trail_id: id });
      for (const t of trailTasks) {
        await base44.entities.WeeklyTrailTask.delete(t.id);
      }
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({queryKey: ['weeklyTrails']}); 
      setCurrentTrailIndex(Math.max(0, currentTrailIndex - 1));
      toast.success("Trilha excluída!"); 
    }
  });

  // Mutations - Tasks
  const createTask = useMutation({
    mutationFn: async (data) => {
      const dayTasks = optimisticTasks.filter(t => t.day_of_week === selectedDay);
      const newOrder = dayTasks.length > 0 ? Math.max(...dayTasks.map(t => t.order)) + 1 : 0;
      return await base44.entities.WeeklyTrailTask.create({ ...data, trail_id: currentTrail.id, day_of_week: selectedDay, order: newOrder, is_completed: false });
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklyTasks']}); setTaskModalOpen(false); toast.success("Tarefa adicionada!"); }
  });
  const updateTask = useMutation({
    mutationFn: ({id, data}) => base44.entities.WeeklyTrailTask.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklyTasks']}); setTaskModalOpen(false); }
  });
  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.WeeklyTrailTask.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: ['weeklyTasks']}); toast.success("Tarefa excluída!"); }
  });

  // Handlers
  const handleSaveSubject = () => {
    if (!subjectForm.name) return toast.error("Preencha o nome da matéria");
    if (editingSubject) {
      updateSubject.mutate({ id: editingSubject.id, data: subjectForm });
    } else {
      createSubject.mutate(subjectForm);
    }
  };

  const handleSaveTrail = () => {
    if (!trailForm.name) return toast.error("Preencha o nome da trilha");
    if (editingTrail) {
      updateTrail.mutate({ id: editingTrail.id, data: trailForm });
    } else {
      createTrail.mutate(trailForm);
    }
  };

  const handleSaveTask = () => {
    if (!taskForm.title) return toast.error("Preencha o título da tarefa");
    const data = {
      title: taskForm.title,
      duration_minutes: parseInt(taskForm.duration_minutes) || 0,
      subject_id: taskForm.subject_id === "none" ? null : taskForm.subject_id
    };
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data });
    } else {
      createTask.mutate(data);
    }
  };

  const handleCloneTrail = async () => {
    if (!currentTrail) return;
    try {
      const clonedTrail = await base44.entities.WeeklyTrail.create({
        user_email: user.email,
        name: `${currentTrail.name} (Cópia)`,
        order: trails.length
      });
      for (const task of tasks) {
        await base44.entities.WeeklyTrailTask.create({
          ...task,
          id: undefined,
          created_date: undefined,
          updated_date: undefined,
          trail_id: clonedTrail.id,
          is_completed: false
        });
      }
      queryClient.invalidateQueries({queryKey: ['weeklyTrails']});
      setCurrentTrailIndex(trails.length);
      toast.success("Trilha clonada com sucesso!");
    } catch (error) {
      toast.error("Erro ao clonar trilha.");
    }
  };

  const handleRestartTrail = async () => {
    if (!currentTrail) return;
    try {
      for (const task of tasks) {
        if (task.is_completed) {
          await base44.entities.WeeklyTrailTask.update(task.id, { is_completed: false });
        }
      }
      queryClient.invalidateQueries({queryKey: ['weeklyTasks']});
      toast.success("Trilha reiniciada!");
    } catch (error) {
      toast.error("Erro ao reiniciar trilha.");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceDay = source.droppableId;
    const destDay = destination.droppableId;

    let newTasks = Array.from(optimisticTasks);
    const draggedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    const draggedTask = newTasks[draggedTaskIndex];

    newTasks.splice(draggedTaskIndex, 1);
    const destTasks = newTasks.filter(t => t.day_of_week === destDay).sort((a,b) => a.order - b.order);
    destTasks.splice(destination.index, 0, { ...draggedTask, day_of_week: destDay });

    // Update optimistic state
    const finalTasks = newTasks.filter(t => t.day_of_week !== destDay).concat(
      destTasks.map((t, idx) => ({ ...t, order: idx }))
    );
    setOptimisticTasks(finalTasks);

    // Update backend
    try {
      await Promise.all(destTasks.map((t, idx) => 
        base44.entities.WeeklyTrailTask.update(t.id, { day_of_week: destDay, order: idx })
      ));
      queryClient.invalidateQueries({queryKey: ['weeklyTasks']});
    } catch(err) {
      toast.error("Erro ao reordenar tarefas");
      queryClient.invalidateQueries({queryKey: ['weeklyTasks']});
    }
  };

  const nextTrail = () => setCurrentTrailIndex(prev => Math.min(trails.length - 1, prev + 1));
  const prevTrail = () => setCurrentTrailIndex(prev => Math.max(0, prev - 1));

  if (!user) return <div className="flex-1 flex items-center justify-center min-h-[50vh]"><span className="loading loading-spinner"></span></div>;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* SEÇÃO MATÉRIAS CADASTRADAS */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <BookOpen className="w-6 h-6 text-primary" />
            Matérias cadastradas
          </h2>
          <Button onClick={() => {
            setEditingSubject(null);
            setSubjectForm({ name: "", color: COLORS[0] });
            setSubjectModalOpen(true);
          }} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar matéria
          </Button>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <BookOpen className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Adicione matérias ao plano</h3>
            <p className="text-sm mb-6 max-w-sm text-center">Matérias são essenciais para organizar seus estudos. Adicione quantas achar necessário!</p>
            <Button variant="outline" onClick={() => { setEditingSubject(null); setSubjectModalOpen(true); }}>
              Adicionar matéria
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {subjects.map(sub => (
              <div 
                key={sub.id} 
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg whitespace-nowrap group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                <span className="font-medium text-sm">{sub.name}</span>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-2 gap-1">
                  <button onClick={() => { setEditingSubject(sub); setSubjectForm({name: sub.name, color: sub.color}); setSubjectModalOpen(true); }} className="text-slate-400 hover:text-blue-500">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteSubject.mutate(sub.id)} className="text-slate-400 hover:text-red-500">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO TRILHA SEMANAL */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Target className="w-6 h-6 text-primary" />
            Trilha semanal
          </h2>
          
          {trails.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevTrail} disabled={currentTrailIndex === 0} className="h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-sm min-w-[140px] text-center">
                {currentTrail?.name || "Sem trilha"}
              </div>
              <Button variant="outline" size="icon" onClick={nextTrail} disabled={currentTrailIndex >= trails.length - 1} className="h-9 w-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 ml-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-slate-800 dark:border-slate-700">
                  <DropdownMenuItem onClick={() => { setEditingTrail(null); setTrailForm({name: ""}); setTrailModalOpen(true); }} className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" /> Nova Trilha
                  </DropdownMenuItem>
                  {currentTrail && (
                    <>
                      <DropdownMenuItem onClick={() => { setEditingTrail(currentTrail); setTrailForm({name: currentTrail.name}); setTrailModalOpen(true); }} className="cursor-pointer">
                        <Edit2 className="w-4 h-4 mr-2" /> Editar Nome
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCloneTrail} className="cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" /> Clonar Trilha Atual
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="dark:bg-slate-700" />
                      <DropdownMenuItem onClick={handleRestartTrail} className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-900/20">
                        <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar Trilha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if(confirm("Tem certeza que deseja excluir esta trilha?")) {
                          deleteTrail.mutate(currentTrail.id);
                        }
                      }} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                        <Trash className="w-4 h-4 mr-2" /> Excluir Trilha
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {trails.length === 0 && trailsLoaded ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <Target className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Sua primeira trilha</h3>
            <p className="text-sm mb-6 max-w-sm text-center">Crie sua primeira trilha semanal para organizar seus estudos dia a dia.</p>
            <Button onClick={() => { setEditingTrail(null); setTrailForm({name: "Foco Total"}); setTrailModalOpen(true); }}>
              Criar Nova Trilha
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
              <div className="flex gap-4 min-w-[900px] h-full items-stretch">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex-1 min-w-[240px] flex flex-col bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 font-semibold text-sm text-center text-slate-700 dark:text-slate-300">
                      {day}
                    </div>
                    
                    <div className="p-3">
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-2 hover:border-solid hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:border-slate-700"
                        onClick={() => {
                          setSelectedDay(day);
                          setEditingTask(null);
                          setTaskForm({ title: "", subject_id: "none", duration_minutes: 30 });
                          setTaskModalOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <Droppable droppableId={day}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 p-3 pt-0 flex flex-col gap-3 min-h-[150px] transition-colors",
                            snapshot.isDraggingOver ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                          )}
                        >
                          {optimisticTasks.filter(t => t.day_of_week === day).map((task, index) => {
                            const taskSubject = subjects.find(s => s.id === task.subject_id);
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm group relative",
                                      task.is_completed ? "border-green-200 dark:border-green-900/50 opacity-70" : "border-slate-200 dark:border-slate-700",
                                      snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1 z-50 border-primary" : ""
                                    )}
                                  >
                                    <div 
                                      {...provided.dragHandleProps} 
                                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab hover:text-slate-500 transition-opacity"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    
                                    <div className="pl-6 pr-6">
                                      {taskSubject && (
                                        <div className="mb-1.5 flex items-center">
                                          <span 
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                                            style={{ backgroundColor: `${taskSubject.color}20`, color: taskSubject.color }}
                                          >
                                            {taskSubject.name}
                                          </span>
                                        </div>
                                      )}
                                      <h4 className={cn("text-sm font-medium mb-1 line-clamp-2", task.is_completed && "line-through text-slate-500 dark:text-slate-400")}>
                                        {task.title}
                                      </h4>
                                      {task.duration_minutes > 0 && (
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {task.duration_minutes}m
                                        </div>
                                      )}
                                    </div>

                                    <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => updateTask.mutate({ id: task.id, data: { is_completed: !task.is_completed } })}
                                        className={cn("p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", task.is_completed ? "text-green-500" : "text-slate-400")}
                                        title={task.is_completed ? "Desmarcar" : "Concluir"}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 dark:bg-slate-800 dark:border-slate-700">
                                          <DropdownMenuItem onClick={() => {
                                            setEditingTask(task);
                                            setTaskForm({
                                              title: task.title,
                                              subject_id: task.subject_id || "none",
                                              duration_minutes: task.duration_minutes || 0
                                            });
                                            setTaskModalOpen(true);
                                          }} className="cursor-pointer">
                                            <Edit2 className="w-4 h-4 mr-2" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="dark:bg-slate-700" />
                                          <DropdownMenuItem onClick={() => deleteTask.mutate(task.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                            <Trash className="w-4 h-4 mr-2" /> Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}
      </section>

      {/* MODAL MATÉRIA */}
      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Editar Matéria" : "Cadastrar Matéria"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome da matéria</Label>
              <Input 
                placeholder="Ex: Português, Matemática..." 
                value={subjectForm.name} 
                onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                className="dark:bg-slate-950 dark:border-slate-700"
              />
              <p className="text-xs text-slate-500">Este é o nome que identifica a disciplina estudada</p>
            </div>
            <div className="space-y-2">
              <Label>Cor da matéria</Label>
              <div className="flex flex-wrap gap-2 pt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSubjectForm({...subjectForm, color})}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform hover:scale-110",
                      subjectForm.color === color ? "ring-2 ring-offset-2 ring-slate-800 dark:ring-white dark:ring-offset-slate-900" : ""
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSubject}>{editingSubject ? "Salvar" : "Criar matéria"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TRILHA */}
      <Dialog open={trailModalOpen} onOpenChange={setTrailModalOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>{editingTrail ? "Editar Trilha" : "Nova Trilha Semanal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Trilha</Label>
              <Input 
                placeholder="Ex: Foco Total, Revisão Semanal..." 
                value={trailForm.name} 
                onChange={e => setTrailForm({...trailForm, name: e.target.value})}
                className="dark:bg-slate-950 dark:border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrailModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTrail}>{editingTrail ? "Salvar" : "Criar trilha"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TAREFA */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : `Nova Tarefa - ${selectedDay}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Descrição da Tarefa</Label>
              <Input 
                placeholder="Ex: Resolver 10 questões, Revisar fórmulas..." 
                value={taskForm.title} 
                onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                className="dark:bg-slate-950 dark:border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Matéria (Opcional)</Label>
              <Select value={taskForm.subject_id} onValueChange={v => setTaskForm({...taskForm, subject_id: v})}>
                <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                  <SelectValue placeholder="Selecione uma matéria..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  <SelectItem value="none">Nenhuma (Tarefa Geral)</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração Estimada (minutos)</Label>
              <Input 
                type="number"
                min="0"
                step="5"
                placeholder="Ex: 30" 
                value={taskForm.duration_minutes} 
                onChange={e => setTaskForm({...taskForm, duration_minutes: e.target.value})}
                className="dark:bg-slate-950 dark:border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTask}>{editingTask ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}