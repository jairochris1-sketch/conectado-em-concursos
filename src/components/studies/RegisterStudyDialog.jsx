import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

const SUBJECTS = [
  "Português",
  "Matemática",
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Penal",
  "Informática",
  "Conhecimentos Gerais",
  "Raciocínio Lógico",
  "Contabilidade",
];

function parseTimeToSeconds(hms) {
  if (!hms) return 0;
  const parts = hms.split(":").map((n) => parseInt(n || "0", 10));
  const [h = 0, m = 0, s = 0] = parts;
  return (h * 3600) + (m * 60) + s;
}

export default function RegisterStudyDialog({ open, onOpenChange, defaultSubject, onSaved }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    study_date: today,
    subject: defaultSubject || "",
    content_title: "",
    notes: "",
    study_type: "Teoria",
    duration_hms: "",
    questions_count: 0,
    errors_count: 0,
    completed: false,
    review_enabled: false,
    review_intervals_days: [1, 7, 15, 30],
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.StudyRecord.create({
        study_date: form.study_date,
        subject: form.subject,
        content_title: form.content_title,
        notes: form.notes,
        study_type: form.study_type,
        duration_seconds: parseTimeToSeconds(form.duration_hms),
        questions_count: Number(form.questions_count || 0),
        errors_count: Number(form.errors_count || 0),
        completed: !!form.completed,
        review_enabled: !!form.review_enabled,
        review_intervals_days: form.review_enabled ? form.review_intervals_days : [],
      });
      onOpenChange(false);
      if (onSaved) onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Estudo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Linha 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Data do estudo</label>
              <Input type="date" value={form.study_date} onChange={(e) => setForm({ ...form, study_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Matéria</label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Matéria..." />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Input placeholder="Conteúdo..." value={form.content_title} onChange={(e) => setForm({ ...form, content_title: e.target.value })} />
            </div>
          </div>

          {/* Assunto */}
          <div>
            <label className="text-sm font-medium">Assunto abordado</label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Linha 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium">Tipo do estudo</label>
              <Select value={form.study_type} onValueChange={(v) => setForm({ ...form, study_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teoria">Teoria</SelectItem>
                  <SelectItem value="Questoes">Questões</SelectItem>
                  <SelectItem value="Revisao">Revisão</SelectItem>
                  <SelectItem value="Simulado">Simulado</SelectItem>
                  <SelectItem value="Leitura">Leitura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tempo líquido</label>
              <Input placeholder="HH:MM:SS" value={form.duration_hms} onChange={(e) => setForm({ ...form, duration_hms: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Questões</label>
              <Input type="number" min="0" value={form.questions_count} onChange={(e) => setForm({ ...form, questions_count: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Erros</label>
              <Input type="number" min="0" value={form.errors_count} onChange={(e) => setForm({ ...form, errors_count: e.target.value })} />
            </div>
          </div>

          {/* Concluir conteúdo */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Concluir conteúdo</p>
                <p className="text-sm text-gray-600">Marque o conteúdo como concluído, caso você tenha estudado toda a teoria.</p>
              </div>
              <Switch checked={form.completed} onCheckedChange={(v) => setForm({ ...form, completed: v })} />
            </div>
          </div>

          {/* Programar revisões */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Programar revisões</p>
                <p className="text-sm text-gray-600">Programe revisões de forma automática. Contagem em dias, a partir da data do estudo.</p>
              </div>
              <Switch checked={form.review_enabled} onCheckedChange={(v) => setForm({ ...form, review_enabled: v })} />
            </div>
            {form.review_enabled && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {form.review_intervals_days.map((d, i) => (
                  <Input key={i} type="number" min="1" value={d} onChange={(e) => {
                    const arr = [...form.review_intervals_days];
                    arr[i] = Number(e.target.value || 0);
                    setForm({ ...form, review_intervals_days: arr });
                  }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.study_date || !form.subject}>Salvar estudo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}