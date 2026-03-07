import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Link as LinkIcon, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import RegisterStudyDialog from "../components/studies/RegisterStudyDialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import WeeklyCreateDialog from "../components/weekly/WeeklyCreateDialog";
import TaskFormDialog from "../components/weekly/TaskFormDialog";
import TaskCard from "../components/weekly/TaskCard";


const DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function WeeklyTrackPage() {
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hints (coachmarks) simples, salvos em localStorage para não repetir
  const [showHintAdd, setShowHintAdd] = useState(() => !localStorage.getItem('weekly_hint_add'));
  const [showHintDrag, setShowHintDrag] = useState(() => !localStorage.getItem('weekly_hint_drag'));
  const [showHintNav, setShowHintNav] = useState(() => !localStorage.getItem('weekly_hint_nav'));
  const [showHintMenu, setShowHintMenu] = useState(() => !localStorage.getItem('weekly_hint_menu'));

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTrackName, setNewTrackName] = useState("");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [defaultDay, setDefaultDay] = useState("monday");
  const [editingTask, setEditingTask] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const currentTrack = tracks[currentIndex] || null;

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (currentTrack) loadTasks(currentTrack.id);
    else setTasks([]);
  }, [currentTrack?.id]);

  const loadTracks = async () => {
    setLoading(true);
    const list = await base44.entities.WeeklyTrack.list("-created_date", 50);
    setTracks(list);
    setCurrentIndex(list.length > 0 ? 0 : 0);
    setLoading(false);
  };

  const loadTasks = async (trackId) => {
    const list = await base44.entities.WeeklyTask.filter({ track_id: trackId }, "order", 500);
    setTasks(list);
  };

  const groupedByDay = useMemo(() => {
    const map = DAYS.reduce((acc, d) => ({ ...acc, [d.key]: [] }), {});
    tasks.forEach((t) => {
      if (!map[t.day_of_week]) map[t.day_of_week] = [];
      map[t.day_of_week].push(t);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.order || 0) - (b.order || 0)));
    return map;
  }, [tasks]);

  const handleCreateTrack = async (name) => {
    const t = await base44.entities.WeeklyTrack.create({ name });
    setCreateOpen(false);
    await loadTracks();
    const idx = (await base44.entities.WeeklyTrack.list("-created_date", 50)).findIndex((x) => x.id === t.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
  };

  const handleRenameTrack = async () => {
    await base44.entities.WeeklyTrack.update(currentTrack.id, { name: newTrackName });
    setRenameOpen(false);
    await loadTracks();
  };

  const handleDeleteTrack = async () => {
    if (!currentTrack) return;
    const items = await base44.entities.WeeklyTask.filter({ track_id: currentTrack.id }, "order", 1000);
    for (const it of items) await base44.entities.WeeklyTask.delete(it.id);
    await base44.entities.WeeklyTrack.delete(currentTrack.id);
    await loadTracks();
    setCurrentIndex(0);
  };

  const handleCloneTrack = async () => {
    if (!currentTrack) return;
    const clone = await base44.entities.WeeklyTrack.create({ name: `${currentTrack.name} (Cópia)` });
    const items = await base44.entities.WeeklyTask.filter({ track_id: currentTrack.id }, "order", 1000);
    if (items.length > 0) {
      const data = items.map((i) => ({
        track_id: clone.id,
        day_of_week: i.day_of_week,
        title: i.title,
        duration_minutes: i.duration_minutes,
        questions_target: i.questions_target,
        completed: false,
        order: i.order,
        notes: i.notes || "",
      }));
      await base44.entities.WeeklyTask.bulkCreate(data);
    }
    await loadTracks();
    const idx = (await base44.entities.WeeklyTrack.list("-created_date", 50)).findIndex((x) => x.id === clone.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
  };

  const handleResetTrack = async () => {
    if (!currentTrack) return;
    const items = await base44.entities.WeeklyTask.filter({ track_id: currentTrack.id }, "order", 1000);
    for (const it of items) await base44.entities.WeeklyTask.update(it.id, { completed: false });
    await loadTasks(currentTrack.id);
  };

  const openAddTask = (day) => {
    setDefaultDay(day);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const saveTask = async (data) => {
    if (editingTask) {
      await base44.entities.WeeklyTask.update(editingTask.id, {
        ...editingTask,
        ...data,
        track_id: currentTrack.id,
      });
    } else {
      const dayList = groupedByDay[data.day_of_week] || [];
      await base44.entities.WeeklyTask.create({
        track_id: currentTrack.id,
        day_of_week: data.day_of_week,
        title: data.title,
        duration_minutes: data.duration_minutes || 0,
        questions_target: data.questions_target || 0,
        completed: false,
        order: dayList.length,
        notes: data.notes || "",
      });
    }
    setTaskDialogOpen(false);
    await loadTasks(currentTrack.id);
  };

  const toggleComplete = async (task) => {
    await base44.entities.WeeklyTask.update(task.id, { completed: !task.completed });
    await loadTasks(currentTrack.id);
  };

  const deleteTask = async (task) => {
    await base44.entities.WeeklyTask.delete(task.id);
    await loadTasks(currentTrack.id);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (!currentTrack) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const destDay = destination.droppableId;
    const srcDay = source.droppableId;

    if (destDay === srcDay && destination.index === source.index) return;

    // Build new orders for src and dest day
    const srcList = groupedByDay[srcDay].filter((t) => t.id !== task.id);
    const destList = destDay === srcDay ? srcList.slice() : groupedByDay[destDay].slice();

    // Insert task into destList at new index
    const moved = { ...task, day_of_week: destDay };
    destList.splice(destination.index, 0, moved);

    // Recompute order numbers
    const updates = [];
    srcList.forEach((t, idx) => updates.push({ id: t.id, data: { order: idx } }));
    destList.forEach((t, idx) => updates.push({ id: t.id, data: { order: idx, day_of_week: destDay } }));

    // Apply updates sequentially (SDK doesn't expose bulk update)
    for (const u of updates) {
      await base44.entities.WeeklyTask.update(u.id, u.data);
    }
    await loadTasks(currentTrack.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Trilha semanal</h1>
          </div>
          <Button className="gap-2" onClick={() => setRegisterOpen(true)}><Plus className="w-4 h-4" /> Registrar estudo</Button>
        </div>

        {tracks.length === 0 ? (
          <Card className="dark:bg-gray-800">
            <CardContent className="py-16 text-center">
              <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Crie sua primeira Trilha Semanal</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Você pode organizar seu estudo semanal com ajuda das trilhas. Crie uma agora!</p>
              <Button onClick={() => setCreateOpen(true)}>Criar Trilha Semanal</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentIndex((p) => (p - 1 + tracks.length) % tracks.length)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="px-3 py-1 text-sm">{tracks[currentIndex]?.name}</Badge>
              <Button variant="outline" size="icon" onClick={() => setCurrentIndex((p) => (p + 1) % tracks.length)}>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="ml-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setCreateOpen(true)}>Nova trilha</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setNewTrackName(currentTrack.name); setRenameOpen(true); }}>Renomear</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCloneTrack}>Clonar</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetTrack}>Reiniciar (desmarcar concluídas)</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={handleDeleteTrack}>Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hint: navegação entre trilhas */}
              {tracks.length > 1 && showHintNav && (
                <div className="ml-3 p-3 rounded-lg bg-slate-900 text-slate-100 text-sm shadow border border-slate-700 max-w-md">
                  <p className="font-semibold mb-1">Navegue entre suas trilhas</p>
                  <p className="opacity-90">Use as setas para alternar entre trilhas diferentes que você criou.</p>
                  <div className="text-right mt-2">
                    <Button size="sm" onClick={() => { localStorage.setItem('weekly_hint_nav','1'); setShowHintNav(false); }}>Entendi</Button>
                  </div>
                </div>
              )}

              {/* Hint: menu de opções */}
              {showHintMenu && (
                <div className="ml-3 p-3 rounded-lg bg-slate-900 text-slate-100 text-sm shadow border border-slate-700 max-w-md">
                  <p className="font-semibold mb-1">Opções da Trilha Semanal</p>
                  <p className="opacity-90">No botão de três pontos, você pode criar, renomear, clonar, reiniciar ou excluir sua trilha.</p>
                  <div className="text-right mt-2">
                    <Button size="sm" onClick={() => { localStorage.setItem('weekly_hint_menu','1'); setShowHintMenu(false); }}>Entendi</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Hint: adicionar tarefa (quando não há tarefas) */}
            {currentTrack && tasks.length === 0 && showHintAdd && (
              <div className="mb-3 p-4 rounded-lg bg-slate-900 text-slate-100 text-sm shadow border border-slate-700 max-w-lg">
                <p className="font-semibold mb-1">Adicione tarefas!</p>
                <p className="opacity-90">Use o botão “+” em qualquer dia para criar tarefas da sua trilha (por matéria, duração e metas).</p>
                <div className="text-right mt-2">
                  <Button size="sm" onClick={() => { localStorage.setItem('weekly_hint_add','1'); setShowHintAdd(false); }}>Entendi</Button>
                </div>
              </div>
            )}

            {/* Hint: arrastar/soltar e concluir (quando já existe tarefa) */}
            {currentTrack && tasks.length > 0 && showHintDrag && (
              <div className="mb-3 p-4 rounded-lg bg-slate-900 text-slate-100 text-sm shadow border border-slate-700 max-w-2xl">
                <p className="font-semibold mb-1">Arraste, ajuste e conclua suas tarefas!</p>
                <p className="opacity-90">Reorganize ou mude o dia arrastando as tarefas. Ao finalizar, marque como concluída no ícone à esquerda.</p>
                <div className="text-right mt-2">
                  <Button size="sm" onClick={() => { localStorage.setItem('weekly_hint_drag','1'); setShowHintDrag(false); }}>Entendi</Button>
                </div>
              </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {DAYS.map((d) => (
                  <div key={d.key} className="rounded-lg border bg-white dark:bg-slate-800 p-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-semibold ${d.key === 'thursday' ? 'text-white bg-blue-600 px-2 py-0.5 rounded' : 'text-gray-900 dark:text-white'}`}>{d.label}</h3>
                      <Button size="sm" variant="outline" onClick={() => openAddTask(d.key)}>+</Button>
                    </div>
                    <Droppable droppableId={d.key}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[120px] flex flex-col gap-2">
                          {(groupedByDay[d.key] || []).map((t, idx) => (
                            <Draggable key={t.id} draggableId={t.id} index={idx}>
                              {(dragProvided) => (
                                <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                                  <TaskCard
                                    task={t}
                                    onToggleComplete={() => toggleComplete(t)}
                                    onEdit={() => { setEditingTask(t); setTaskDialogOpen(true); }}
                                    onDelete={() => deleteTask(t)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </>
        )}
      </div>

      {/* Criar Trilha */}
      <WeeklyCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreateTrack}
      />

      {/* Renomear Trilha */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Trilha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancelar</Button>
              <Button onClick={handleRenameTrack} disabled={!newTrackName.trim()}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Criar/Editar Tarefa */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSave={saveTask}
        defaultDay={defaultDay}
        task={editingTask}
      />
    </div>
  );
}