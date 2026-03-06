import React, { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SubjectManager({ userEmail, subjects, setSubjects }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("O nome da matéria é obrigatório");
      return;
    }

    try {
      const newSubject = await base44.entities.TrailSubject.create({
        user_email: userEmail,
        name: name.trim(),
        color
      });
      setSubjects([...subjects, newSubject]);
      setIsOpen(false);
      setName("");
      setColor("#3b82f6");
      toast.success("Matéria cadastrada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar matéria");
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.TrailSubject.delete(id);
      setSubjects(subjects.filter(s => s.id !== id));
      toast.success("Matéria removida");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover matéria");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Settings className="w-5 h-5 text-blue-500" />
          Matérias cadastradas
        </h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar matéria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Matéria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da matéria</Label>
                <p className="text-sm text-gray-500">Este é o nome que identifica a disciplina estudada</p>
                <Input 
                  placeholder="Português..." 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Cor da matéria</Label>
                <p className="text-sm text-gray-500">Selecione uma cor para identificar a matéria</p>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-200 cursor-pointer p-1"
                  />
                  <span className="text-sm font-medium">{color}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">Criar matéria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Adicione matérias ao plano</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">Matérias são essenciais. Adicione tantas quanto necessário!</p>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            Adicionar matéria
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {subjects.map(subject => (
            <div 
              key={subject.id} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
              <span className="text-sm font-medium">{subject.name}</span>
              <button 
                onClick={() => handleDelete(subject.id)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}