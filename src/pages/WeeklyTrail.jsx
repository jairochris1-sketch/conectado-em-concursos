import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { ChevronLeft, ChevronRight, MoreHorizontal, Footprints, Info, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import SubjectManager from "../components/weekly-trail/SubjectManager";
import TrailBoard from "../components/weekly-trail/TrailBoard";

export default function WeeklyTrailPage() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [trails, setTrails] = useState([]);
  const [currentTrailIndex, setCurrentTrailIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isNewTrailOpen, setIsNewTrailOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTrailName, setNewTrailName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData?.email) {
          const [fetchedSubjects, fetchedTrails] = await Promise.all([
            base44.entities.TrailSubject.filter({ user_email: userData.email }),
            base44.entities.WeeklyTrail.filter({ user_email: userData.email })
          ]);

          setSubjects(fetchedSubjects);
          
          if (fetchedTrails.length > 0) {
            setTrails(fetchedTrails);
          } else {
            // Create default trail
            const defaultTrail = await base44.entities.WeeklyTrail.create({
              user_email: userData.email,
              name: "Foco total",
              tasks: []
            });
            setTrails([defaultTrail]);
          }
        }
      } catch (error) {
        console.error("Error loading trail data", error);
        toast.error("Erro ao carregar dados da trilha");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentTrail = trails[currentTrailIndex];

  const updateCurrentTrail = async (updatedTrail) => {
    // Optimistic update
    const newTrails = [...trails];
    newTrails[currentTrailIndex] = updatedTrail;
    setTrails(newTrails);

    try {
      await base44.entities.WeeklyTrail.update(updatedTrail.id, { tasks: updatedTrail.tasks });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar trilha");
    }
  };

  const handleCreateTrail = async () => {
    if (!newTrailName.trim()) return;
    try {
      const newTrail = await base44.entities.WeeklyTrail.create({
        user_email: user.email,
        name: newTrailName.trim(),
        tasks: []
      });
      setTrails([...trails, newTrail]);
      setCurrentTrailIndex(trails.length);
      setIsNewTrailOpen(false);
      setNewTrailName("");
      toast.success("Trilha criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar trilha");
    }
  };

  const handleRenameTrail = async () => {
    if (!newTrailName.trim() || !currentTrail) return;
    try {
      await base44.entities.WeeklyTrail.update(currentTrail.id, { name: newTrailName.trim() });
      const newTrails = [...trails];
      newTrails[currentTrailIndex].name = newTrailName.trim();
      setTrails(newTrails);
      setIsRenameOpen(false);
      setNewTrailName("");
      toast.success("Trilha renomeada");
    } catch (error) {
      toast.error("Erro ao renomear trilha");
    }
  };

  const handleCloneTrail = async () => {
    if (!currentTrail) return;
    try {
      // Clone without completion status
      const clonedTasks = (currentTrail.tasks || []).map(t => ({
        ...t,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_completed: false
      }));

      const newTrail = await base44.entities.WeeklyTrail.create({
        user_email: user.email,
        name: `${currentTrail.name} (Cópia)`,
        tasks: clonedTasks
      });
      setTrails([...trails, newTrail]);
      setCurrentTrailIndex(trails.length);
      toast.success("Trilha clonada com sucesso!");
    } catch (error) {
      toast.error("Erro ao clonar trilha");
    }
  };

  const handleRestartTrail = async () => {
    if (!currentTrail) return;
    const restartedTasks = (currentTrail.tasks || []).map(t => ({ ...t, is_completed: false }));
    const updatedTrail = { ...currentTrail, tasks: restartedTasks };
    await updateCurrentTrail(updatedTrail);
    toast.success("Trilha reiniciada (todas as tarefas marcadas como pendentes)");
  };

  const handleDeleteTrail = async () => {
    if (!currentTrail || trails.length <= 1) {
      toast.error("Você não pode excluir sua única trilha");
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir a trilha "${currentTrail.name}"?`)) {
      try {
        await base44.entities.WeeklyTrail.delete(currentTrail.id);
        const newTrails = trails.filter(t => t.id !== currentTrail.id);
        setTrails(newTrails);
        setCurrentTrailIndex(Math.max(0, currentTrailIndex - 1));
        toast.success("Trilha excluída");
      } catch (error) {
        toast.error("Erro ao excluir trilha");
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Link to={createPageUrl("StudyPlanning")} className="text-blue-500 hover:underline text-sm mb-2 inline-block">
            &larr; Voltar para Planejamento
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Footprints className="w-8 h-8 text-orange-500" />
            Trilha Semanal
          </h1>
          <p className="text-gray-500 mt-1">
            Organize suas metas diárias com flexibilidade e adapte sua rotina.
          </p>
        </div>
      </div>

      <SubjectManager 
        userEmail={user?.email} 
        subjects={subjects} 
        setSubjects={setSubjects} 
      />

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentTrailIndex(Math.max(0, currentTrailIndex - 1))}
              disabled={currentTrailIndex === 0}
              className="h-8 w-8 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 font-semibold text-sm min-w-[120px] text-center">
              {currentTrail?.name}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentTrailIndex(Math.min(trails.length - 1, currentTrailIndex + 1))}
              disabled={currentTrailIndex === trails.length - 1}
              className="h-8 w-8 text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => { setNewTrailName(""); setIsNewTrailOpen(true); }}>
                Criar nova trilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNewTrailName(currentTrail?.name || ""); setIsRenameOpen(true); }}>
                Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCloneTrail}>
                Clonar trilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRestartTrail}>
                Reiniciar trilha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteTrail} className="text-red-500" disabled={trails.length <= 1}>
                Excluir trilha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {currentTrail && (
          <TrailBoard 
            trail={currentTrail} 
            subjects={subjects} 
            onUpdateTrail={updateCurrentTrail} 
          />
        )}
      </div>

      {/* Modals */}
      <Dialog open={isNewTrailOpen} onOpenChange={setIsNewTrailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Trilha</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nome da Trilha</Label>
            <Input 
              placeholder="Ex: Trilha Semana Impar" 
              value={newTrailName} 
              onChange={(e) => setNewTrailName(e.target.value)} 
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTrailOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTrail} className="bg-blue-600">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Trilha</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Novo Nome</Label>
            <Input 
              placeholder="Nome da trilha" 
              value={newTrailName} 
              onChange={(e) => setNewTrailName(e.target.value)} 
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenameTrail} className="bg-blue-600">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}