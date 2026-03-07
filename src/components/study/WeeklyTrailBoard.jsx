import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const days = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function WeeklyTrailBoard() {
  const [trails, setTrails] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tasksByDay, setTasksByDay] = useState({});
  const [subjects, setSubjects] = useState([]);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ day_of_week: "monday", title: "", duration_minutes: 0, subject_id: "" });

  const currentTrail = trails[currentIndex];

  const load = async () => {
    const subs = await base44.entities.StudySubject.list("order");
    setSubjects(subs);

    let trailList = await base44.entities.WeeklyTrail.list("-created_date");
    if (!trailList || trailList.length === 0) {
      const created = await base44.entities.WeeklyTrail.create({ name: "Foco total" });
      trailList = [created];
    }
    setTrails(trailList);

    if (trailList.length > 0) await loadTasks(trailList[currentIndex || 0].id);
  };

  const loadTasks = async (trailId) => {
    const all = await base44.entities.WeeklyTask.filter({ trail_id: trailId }, "position");
    const grouped = days.reduce((acc, d) => ({ ...acc, [d.key]: [] }), {});
    all.forEach((t) => { grouped[t.day_of_week] = [...(grouped[t.day_of_week] || []), t]; });
    setTasksByDay(grouped);
  };

  useEffect(() => { load(); }, []);

  const openAddTask = (dayKey) => {
    setTaskForm({ day_of_week: dayKey, title: "", duration_minutes: 0, subject_id: "" });
    setTaskDialogOpen(true);
  };

  const createTask = async () => {
    if (!currentTrail) return;
    if (!taskForm.title.trim()) return;
    const list = tasksByDay[taskForm.day_of_week] || [];
    await base44.entities.WeeklyTask.create({
      trail_id: currentTrail.id,
      day_of_week: taskForm.day_of_week,
      title: taskForm.title.trim(),
      subject_id: taskForm.subject_id || undefined,
      duration_minutes: taskForm.duration_minutes ? Number(taskForm.duration_minutes) : undefined,
      position: list.length,
    });
    setTaskDialogOpen(false);
    await loadTasks(currentTrail.id);
  };

  const onDragEnd = async (result) => {
    if (!result.destination || !currentTrail) return;
    const sourceDay = result.source.droppableId;
    const destDay = result.destination.droppableId;

    const sourceList = Array.from(tasksByDay[sourceDay] || []);
    const [moved] = sourceList.splice(result.source.index, 1);
    const destList = Array.from(tasksByDay[destDay] || []);
    destList.splice(result.destination.index, 0, moved);

    const updated = { ...tasksByDay, [sourceDay]: sourceList, [destDay]: destList };
    setTasksByDay(updated);

    // persist reordering
    const updates = [];
    updated[sourceDay]?.forEach((t, idx) => {
      updates.push(base44.entities.WeeklyTask.update(t.id, { position: idx, day_of_week: sourceDay }));
    });
    if (sourceDay !== destDay) {
      updated[destDay]?.forEach((t, idx) => {
        updates.push(base44.entities.WeeklyTask.update(t.id, { position: idx, day_of_week: destDay }));
      });
    }
    await Promise.all(updates);
  };

  const createTrail = async () => {
    const t = await base44.entities.WeeklyTrail.create({ name: `Trilha ${trails.length + 1}` });
    const list = [t, ...trails];
    setTrails(list);
    setCurrentIndex(0);
    await loadTasks(list[0].id);
  };

  const deleteCurrentTrail = async () => {
    if (!currentTrail) return;
    const tasks = await base44.entities.WeeklyTask.filter({ trail_id: currentTrail.id });
    await Promise.all(tasks.map((t) => base44.entities.WeeklyTask.delete(t.id)));
    await base44.entities.WeeklyTrail.delete(currentTrail.id);
    const list = await base44.entities.WeeklyTrail.list("-created_date");
    setTrails(list);
    setCurrentIndex(0);
    if (list[0]) await loadTasks(list[0].id);
  };

  useEffect(() => {
    if (currentTrail) loadTasks(currentTrail.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl">Trilha semanal</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => currentIndex < trails.length - 1 && setCurrentIndex(currentIndex + 1)} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={createTrail}>Nova trilha</DropdownMenuItem>
              <DropdownMenuItem onClick={deleteCurrentTrail} className="text-red-500">Excluir trilha</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-8"><Plus className="w-4 h-4 mr-1" /> Registrar estudo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar estudo</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-500">Em breve: histórico de estudos.</p>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!currentTrail ? null : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {days.map((d) => (
                <Droppable key={d.key} droppableId={d.key}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 min-h-[180px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/80">{d.label}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => openAddTask(d.key)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {(tasksByDay[d.key] || []).map((t, idx) => (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="mb-2 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {t.subject_id && (
                                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: subjects.find(s => s.id === t.subject_id)?.color_hex || '#64748b' }} />
                                )}
                                <span className="font-medium">{t.title}</span>
                              </div>
                              {t.duration_minutes ? (
                                <div className="text-xs text-white/60 mt-1">{t.duration_minutes}m</div>
                              ) : null}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </CardContent>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-white/80">Dia da semana</label>
              <Select value={taskForm.day_of_week} onValueChange={(v) => setTaskForm({ ...taskForm, day_of_week: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/80">Título</label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="mt-1" placeholder="Ex.: 30 questões de português" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-white/80">Matéria (opcional)</label>
                <Select value={taskForm.subject_id} onValueChange={(v) => setTaskForm({ ...taskForm, subject_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/80">Duração (min)</label>
                <Input type="number" min={0} value={taskForm.duration_minutes} onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createTask} className="bg-blue-600 hover:bg-blue-700">Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}