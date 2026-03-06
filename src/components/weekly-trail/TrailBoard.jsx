import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Check, Footprints, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DAYS = [
  { id: "segunda", label: "Segunda" },
  { id: "terca", label: "Terça" },
  { id: "quarta", label: "Quarta" },
  { id: "quinta", label: "Quinta" },
  { id: "sexta", label: "Sexta" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" }
];

export default function TrailBoard({ trail, subjects, onUpdateTrail }) {
  const [newTaskDay, setNewTaskDay] = useState(null);
  const [taskSubject, setTaskSubject] = useState("geral");
  const [taskDuration, setTaskDuration] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newTasks = Array.from(trail.tasks || []);
    const sourceTasks = newTasks.filter(t => t.day_of_week === source.droppableId).sort((a, b) => a.order - b.order);
    const destTasks = source.droppableId === destination.droppableId ? sourceTasks : newTasks.filter(t => t.day_of_week === destination.droppableId).sort((a, b) => a.order - b.order);

    const [movedTask] = sourceTasks.splice(source.index, 1);
    movedTask.day_of_week = destination.droppableId;

    destTasks.splice(destination.index, 0, movedTask);

    // Reorder
    const otherTasks = newTasks.filter(t => t.day_of_week !== source.droppableId && t.day_of_week !== destination.droppableId);
    
    let updatedTasks = [...otherTasks];
    
    sourceTasks.forEach((t, i) => { t.order = i; updatedTasks.push(t); });
    if (source.droppableId !== destination.droppableId) {
      destTasks.forEach((t, i) => { t.order = i; updatedTasks.push(t); });
    }

    onUpdateTrail({ ...trail, tasks: updatedTasks });
  };

  const handleAddTask = () => {
    if (!taskDuration.trim()) return;

    const subject = subjects.find(s => s.id === taskSubject);
    
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      day_of_week: newTaskDay,
      subject_id: subject ? subject.id : null,
      subject_name: subject ? subject.name : "Geral",
      subject_color: subject ? subject.color : "#64748b",
      title: taskTitle.trim(),
      duration: taskDuration.trim(),
      is_completed: false,
      order: (trail.tasks || []).filter(t => t.day_of_week === newTaskDay).length
    };

    onUpdateTrail({
      ...trail,
      tasks: [...(trail.tasks || []), newTask]
    });

    setNewTaskDay(null);
    setTaskDuration("");
    setTaskTitle("");
    setTaskSubject("geral");
  };

  const toggleTaskCompletion = (taskId) => {
    const updatedTasks = (trail.tasks || []).map(t => 
      t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
    );
    onUpdateTrail({ ...trail, tasks: updatedTasks });
  };

  const deleteTask = (taskId) => {
    const updatedTasks = (trail.tasks || []).filter(t => t.id !== taskId);
    onUpdateTrail({ ...trail, tasks: updatedTasks });
  };

  const renderTasks = (dayId) => {
    const dayTasks = (trail.tasks || []).filter(t => t.day_of_week === dayId).sort((a, b) => a.order - b.order);

    return dayTasks.map((task, index) => (
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-3 mb-2 rounded-lg border shadow-sm transition-all ${
              task.is_completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'
            } dark:bg-gray-800 dark:border-gray-700 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div 
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white max-w-[120px] truncate"
                style={{ backgroundColor: task.subject_color }}
                title={task.subject_name}
              >
                {task.subject_name}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-500">
                    Excluir tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {task.title && (
              <div className={`text-sm font-medium mb-1 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {task.title}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-medium ${task.is_completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {task.duration}
              </span>
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                  task.is_completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 text-transparent hover:border-green-500'
                }`}
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </Draggable>
    ));
  };

  return (
    <div className="mt-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar snap-x">
          {DAYS.map(day => (
            <div key={day.id} className="min-w-[280px] flex-1 snap-start">
              <div className="text-center font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                {day.label}
              </div>
              
              <Dialog open={newTaskDay === day.id} onOpenChange={(open) => !open && setNewTaskDay(null)}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full mb-3 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => setNewTaskDay(day.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Tarefa - {day.label}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Matéria</Label>
                      <Select value={taskSubject} onValueChange={setTaskSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matéria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duração / Meta</Label>
                      <Input 
                        placeholder="Ex: 2h, 30m, 1h30..." 
                        value={taskDuration} 
                        onChange={(e) => setTaskDuration(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Detalhes (opcional)</Label>
                      <Input 
                        placeholder="Ex: Resolver 10 questões" 
                        value={taskTitle} 
                        onChange={(e) => setTaskTitle(e.target.value)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewTaskDay(null)}>Cancelar</Button>
                    <Button onClick={handleAddTask} disabled={!taskDuration.trim()} className="bg-blue-600 hover:bg-blue-700">
                      Adicionar Tarefa
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Droppable droppableId={day.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[400px] rounded-xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-transparent'
                    }`}
                  >
                    {renderTasks(day.id)}
                    {provided.placeholder}
                    
                    {(!trail.tasks || trail.tasks.filter(t => t.day_of_week === day.id).length === 0) && !snapshot.isDraggingOver && (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 opacity-50">
                        <p className="text-xs text-center text-gray-400">
                          Nenhuma tarefa para este dia
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}