import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

export default function CycleEditor({ cycle, onChange, onSave }) {
  const [name, setName] = useState(cycle?.name || "Meu Ciclo");
  const [items, setItems] = useState(cycle?.items || []);
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState(25);

  const emitChange = (next) => {
    onChange?.(next);
  };

  const addItem = () => {
    if (!subject.trim() || !minutes) return;
    const next = { name, items: [...items, { subject: subject.trim(), duration_minutes: Number(minutes) }] };
    setItems(next.items);
    setSubject("");
    setMinutes(25);
    emitChange(next);
  };

  const move = (idx, dir) => {
    const nextItems = [...items];
    const ni = idx + dir;
    if (ni < 0 || ni >= nextItems.length) return;
    const [it] = nextItems.splice(idx, 1);
    nextItems.splice(ni, 0, it);
    setItems(nextItems);
    emitChange({ name, items: nextItems });
  };

  const remove = (idx) => {
    const nextItems = items.filter((_, i) => i !== idx);
    setItems(nextItems);
    emitChange({ name, items: nextItems });
  };

  const updateName = (v) => {
    setName(v);
    emitChange({ name: v, items });
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60">
      <CardHeader>
        <CardTitle>Configurar Ciclo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <Label>Nome do ciclo</Label>
            <Input value={name} onChange={(e) => updateName(e.target.value)} placeholder="Ex.: Ciclo Mat/Port/Dir" />
          </div>
          <div>
            <Label>Disciplina</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex.: Português" />
          </div>
          <div>
            <Label>Duração (min)</Label>
            <Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={addItem} className="w-full"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
          </div>
        </div>

        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-gray-500">Nenhuma disciplina adicionada.</p>}
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded border bg-white dark:bg-slate-800">
              <div className="text-sm font-medium">{idx + 1}. {it.subject} • {it.duration_minutes} min</div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => move(idx, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => move(idx, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => remove(idx)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onSave?.({ name, items })}>Salvar Ciclo</Button>
        </div>
      </CardContent>
    </Card>
  );
}