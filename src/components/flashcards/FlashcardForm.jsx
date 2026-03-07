import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";

export default function FlashcardForm({ onSaved }) {
  const [subjects, setSubjects] = useState([]);
  const [difficulties, setDifficulties] = useState([
    { value: "facil", label: "Fácil" },
    { value: "medio", label: "Médio" },
    { value: "dificil", label: "Difícil" }
  ]);

  const [form, setForm] = useState({
    subject: "",
    topic: "",
    front: "",
    back: "",
    difficulty: "medio",
    deck_name: "Meus Flashcards",
    tags: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        // 1) Tenta carregar disciplinas do banco (Subject)
        const active = await base44.entities.Subject.filter({ is_active: true }, 'order', 200);
        const src = active && active.length > 0 ? active : await base44.entities.Subject.list('order', 200);
        let opts = (src || []).map((s) => ({
          value: s.value,
          label: s.label || (s.value ? s.value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : '')
        }));

        // 2) Fallback: se não houver Subject, usa o enum do schema de Flashcard
        if (opts.length === 0) {
          const schema = await base44.entities.Flashcard.schema();
          const subjectEnum = schema?.properties?.subject?.enum || [];
          opts = subjectEnum.map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) }));
        }

        setSubjects(opts);
        if (opts.length && !form.subject) {
          setForm((f) => ({ ...f, subject: opts[0].value }));
        }
      } catch (e) {
        // mantém vazio em caso de erro
      }
    };
    loadSubjects();
  }, []);

  const canSubmit = useMemo(() => {
    return form.subject && form.front?.trim()?.length && form.back?.trim()?.length;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const payload = {
        subject: form.subject,
        topic: form.topic?.trim() || undefined,
        front: form.front?.trim() || "",
        back: form.back?.trim() || "",
        difficulty: form.difficulty,
        deck_name: form.deck_name?.trim() || "Meus Flashcards",
        tags: (form.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_active: true
      };
      await base44.entities.Flashcard.create(payload);
      if (onSaved) onSaved();
      // reset front/back/topic/tags only, keep subject/difficulty/deck
      setForm((f) => ({ ...f, topic: "", front: "", back: "", tags: "" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
          <Select value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a disciplina" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assunto (Tópico)</label>
          <Input
            placeholder="Ex: Crase, Porcentagem, Atos Administrativos..."
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frente (Pergunta/Conceito) *</label>
          <div className="border rounded-md overflow-hidden bg-white">
            <ReactQuill theme="snow" value={form.front} onChange={(v) => setForm((f) => ({ ...f, front: v }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verso (Resposta/Explicação) *</label>
          <div className="border rounded-md overflow-hidden bg-white">
            <ReactQuill theme="snow" value={form.back} onChange={(v) => setForm((f) => ({ ...f, back: v }))} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dificuldade</label>
          <Select value={form.difficulty} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Baralho</label>
          <Input value={form.deck_name} onChange={(e) => setForm((f) => ({ ...f, deck_name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
          <Input placeholder="importante, prova_x, revisar..." value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={!canSubmit || saving} className="gap-2">
          {saving ? "Salvando..." : "Salvar Flashcard"}
        </Button>
      </div>
    </form>
  );
}