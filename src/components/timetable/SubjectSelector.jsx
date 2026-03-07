import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function SubjectSelector({ value = [], onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Tenta pela entidade Subject (se existir registros)
        let subjects = [];
        try {
          const s = await base44.entities.Subject.list();
          if (Array.isArray(s) && s.length) {
            subjects = s.map((it) => it.name || it.label || it.value).filter(Boolean);
          }
        } catch { /* ignora se não existir */ }
        // 2) Fallback: distinct a partir de Question.subject (amostra)
        if (!subjects.length) {
          const qs = await base44.entities.Question.filter({}, "-created_date", 400);
          const set = new Set((qs || []).map((q) => q.subject).filter(Boolean));
          subjects = Array.from(set).sort();
        }
        setOptions(subjects);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (s) => {
    const exists = value.includes(s);
    const next = exists ? value.filter((v) => v !== s) : [...value, s];
    onChange(next);
  };

  if (loading) return <div className="py-6 text-sm text-gray-500">Carregando disciplinas…</div>;

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Disciplinas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {options.map((s) => (
            <Button
              key={s}
              type="button"
              variant={value.includes(s) ? "default" : "outline"}
              className="justify-start"
              onClick={() => toggle(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}