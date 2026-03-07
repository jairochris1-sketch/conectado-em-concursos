import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

export default function TaskFormDialog({ open, onOpenChange, onSave, defaultDay = "monday", task }) {
  const [form, setForm] = useState({ title: "", duration_minutes: 0, questions_target: 0, notes: "", day_of_week: defaultDay });

  useEffect(() => {
    if (open) {
      setForm(task ? { ...task } : { title: "", duration_minutes: 0, questions_target: 0, notes: "", day_of_week: defaultDay });
    }
  }, [open, task, defaultDay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Adicionar tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm">Título/Matéria</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Português, Matemática..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Dia</label>
              <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Duração (min)</label>
              <Input type="number" min="0" value={form.duration_minutes}
                     onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value || 0) })} />
            </div>
            <div>
              <label className="text-sm">Meta de questões</label>
              <Input type="number" min="0" value={form.questions_target}
                     onChange={(e) => setForm({ ...form, questions_target: Number(e.target.value || 0) })} />
            </div>
          </div>
          <div>
            <label className="text-sm">Notas</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => onSave(form)} disabled={!form.title.trim()}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}