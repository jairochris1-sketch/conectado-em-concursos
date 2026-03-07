import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen } from "lucide-react";

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center text-center py-16">
    <BookOpen className="w-10 h-10 text-white/60 mb-3" />
    <h3 className="text-lg font-semibold text-white">Adicione matérias ao plano</h3>
    <p className="text-white/70 mb-4">Matérias são essenciais. Adicione tantas quanto necessário!</p>
    <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">Adicionar matéria</Button>
  </div>
);

export default function SubjectManager() {
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ef4444");

  const load = async () => {
    const list = await base44.entities.StudySubject.list("order");
    setSubjects(list);
  };

  useEffect(() => { load(); }, []);

  const createSubject = async () => {
    if (!name.trim()) return;
    await base44.entities.StudySubject.create({ name: name.trim(), color_hex: color, order: subjects.length });
    setName("");
    setColor("#ef4444");
    setOpen(false);
    load();
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Matérias cadastradas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> Cadastrar matéria</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Matéria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/80">Nome da matéria</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Português..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-white/80">Cor da matéria</label>
                <div className="mt-2 w-10 h-7 rounded border border-white/20 overflow-hidden">
                  <input type="color" className="w-full h-full cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={createSubject} className="bg-blue-600 hover:bg-blue-700">Criar matéria</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <div className="flex flex-wrap gap-3">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-slate-800">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: s.color_hex }} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}