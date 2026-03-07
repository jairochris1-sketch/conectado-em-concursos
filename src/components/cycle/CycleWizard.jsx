import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16"
];

function minutesOptions() {
  const arr = [];
  for (let m = 30; m <= 120; m += 15) arr.push(m);
  return arr;
}

async function fetchSubjects() {
  try {
    // Preferir coletar do banco de questões
    const qs = await base44.entities.Question.filter({}, "-created_date", 300);
    const set = new Set(qs.map(q => q.subject).filter(Boolean));
    return Array.from(set).sort();
  } catch (e) {
    try {
      const ss = await base44.entities.Subject.list(200);
      const names = ss.map(s => s.name || s.label || s.value).filter(Boolean);
      return Array.from(new Set(names)).sort();
    } catch {
      return [];
    }
  }
}

function calcWeights(config) {
  // Peso proporcional à importância e à necessidade (menor conhecimento => maior peso)
  const raw = config.map(c => ({
    ...c,
    _w: (c.importance || 1) * (6 - (c.knowledge || 3))
  }));
  const sum = raw.reduce((s, r) => s + (r._w || 0), 0) || 1;
  return raw.map((r, i) => ({ ...r, weight: (r._w / sum), color: r.color || COLORS[i % COLORS.length] }));
}

function buildSequence(subjectsCfg, weeklyHours, minMin) {
  const total = Math.round((weeklyHours || 10) * 60);
  const cfg = calcWeights(subjectsCfg);
  const remaining = Object.fromEntries(cfg.map(c => [c.subject, Math.round(total * c.weight)]));
  const order = [...cfg].sort((a,b) => b.weight - a.weight).map(c => c.subject);
  const seq = [];
  // Distribui sessões com duração mínima, intercalando por peso
  while (Object.values(remaining).some(v => v > 0)) {
    for (const s of order) {
      if (remaining[s] > 0) {
        const d = Math.min(minMin, remaining[s]);
        seq.push({ subject: s, duration_minutes: d });
        remaining[s] -= d;
      }
    }
    if (seq.length > 500) break; // proteção
  }
  return { sequence: seq, cfgWithWeights: cfg };
}

export default function CycleWizard({ open, onOpenChange, initialPlan, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [config, setConfig] = useState([]);
  const [weeklyHours, setWeeklyHours] = useState(25);
  const [studyDays, setStudyDays] = useState(["monday","tuesday","wednesday","thursday","friday"]);
  const [minDur, setMinDur] = useState(60);
  const [maxDur, setMaxDur] = useState(105);
  const [name, setName] = useState("Meu Ciclo de Estudos");
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const subs = await fetchSubjects();
      setSubjects(subs);
      // tenta capturar data do edital
      try {
        const eds = await base44.entities.Edital.list("-created_date", 1);
        const e = eds?.[0];
        const pick = e?.exam_date || e?.prova_date || e?.data_prova || e?.date || "";
        if (pick) setExamDate(String(pick).slice(0,10));
      } catch {}
      // preencher com plano existente
      if (initialPlan) {
        setName(initialPlan.name || "Meu Ciclo de Estudos");
        const subsCfg = (initialPlan.subjects_config || []).map((c,i) => ({
          subject: c.subject,
          importance: c.importance || 3,
          knowledge: c.knowledge || 3,
          color: c.color || COLORS[i % COLORS.length]
        }));
        setSelected(subsCfg.map(c => c.subject));
        setConfig(subsCfg);
        setWeeklyHours(initialPlan.weekly_hours || 25);
        setStudyDays(initialPlan.study_days?.length ? initialPlan.study_days : ["monday","tuesday","wednesday","thursday","friday"]);
        setMinDur(initialPlan.session_min_minutes || 60);
        setMaxDur(initialPlan.session_max_minutes || 105);
        if (initialPlan.exam_date) setExamDate(String(initialPlan.exam_date).slice(0,10));
      }
    })();
  }, [open]);

  const sortedPreview = useMemo(() => {
    const cfg = calcWeights(config);
    return [...cfg].sort((a,b) => b.weight - a.weight);
  }, [config]);

  const toggleSubject = (s) => {
    if (selected.includes(s)) {
      setSelected(prev => prev.filter(x => x !== s));
      setConfig(prev => prev.filter(x => x.subject !== s));
    } else {
      setSelected(prev => [...prev, s]);
      setConfig(prev => [...prev, { subject: s, importance: 3, knowledge: 3, color: COLORS[(prev.length)%COLORS.length] }]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const { sequence, cfgWithWeights } = buildSequence(config, weeklyHours, minDur);
    const payload = {
      name,
      exam_date: examDate || undefined,
      weekly_hours: weeklyHours,
      study_days: studyDays,
      session_min_minutes: minDur,
      session_max_minutes: maxDur,
      subjects_config: cfgWithWeights.map(c => ({ subject: c.subject, importance: c.importance, knowledge: c.knowledge, weight: c.weight, color: c.color })),
      sequence,
      is_active: true
    };

    try {
      let plan;
      if (initialPlan?.id) {
        plan = await base44.entities.StudyCyclePlan.update(initialPlan.id, payload);
      } else {
        plan = await base44.entities.StudyCyclePlan.create(payload);
      }
      onComplete?.(plan);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const DAYS = [
    { key: "sunday", label: "Dom" },
    { key: "monday", label: "Seg" },
    { key: "tuesday", label: "Ter" },
    { key: "wednesday", label: "Qua" },
    { key: "thursday", label: "Qui" },
    { key: "friday", label: "Sex" },
    { key: "saturday", label: "Sáb" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Criar Planejamento" : step === 2 ? "Ajuste as prioridades" : "Configuração semanal"}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Nome do planejamento</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
            </div>
            <p className="text-sm text-gray-600">Selecione as disciplinas do seu planejamento (conforme disponíveis no sistema de questões).</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {subjects.map((s) => (
                <button key={s} onClick={() => toggleSubject(s)} className={`px-3 py-2 rounded-lg border text-sm ${selected.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800'}`}>
                  {s}
                </button>
              ))}
              {subjects.length === 0 && (
                <div className="text-sm text-gray-500 col-span-full">Nenhuma disciplina encontrada. Adicione questões para popular as disciplinas.</div>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <div />
              <Button disabled={selected.length === 0} onClick={() => setStep(2)}>Avançar</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              {config.map((c, idx) => (
                <div key={c.subject} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{c.subject}</div>
                    <Badge style={{ backgroundColor: c.color, color: 'white' }}>{Math.round((calcWeights(config).find(x=>x.subject===c.subject)?.weight||0)*100)}%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">IMPORTÂNCIA</div>
                      <Slider value={[c.importance]} min={1} max={5} step={1} onValueChange={(v)=>{
                        const val=v[0]; setConfig(prev => prev.map(x=> x.subject===c.subject ? {...x, importance: val} : x));
                      }} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">CONHECIMENTO</div>
                      <Slider value={[c.knowledge]} min={1} max={5} step={1} onValueChange={(v)=>{
                        const val=v[0]; setConfig(prev => prev.map(x=> x.subject===c.subject ? {...x, knowledge: val} : x));
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              {config.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma disciplina selecionada.</div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button disabled={config.length===0} onClick={() => setStep(3)}>Avançar</Button>
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="rounded-lg border p-3">
                <div className="font-semibold mb-2">Distribuição prevista</div>
                <div className="space-y-2">
                  {sortedPreview.map((c)=> (
                    <div key={c.subject} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded" style={{backgroundColor: c.color}} />
                        {c.subject}
                      </div>
                      <div className="font-medium">{Math.round(c.weight*100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Horas de estudo por semana</label>
                <span className="text-sm text-gray-600">{weeklyHours} h</span>
              </div>
              <Slider value={[weeklyHours]} min={5} max={60} step={1} onValueChange={(v)=>setWeeklyHours(v[0])} />
            </div>

            <div>
              <label className="text-sm text-gray-700">Dias da semana</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(d => (
                  <button key={d.key} onClick={()=> setStudyDays(prev => prev.includes(d.key) ? prev.filter(x=>x!==d.key) : [...prev, d.key])} className={`px-3 py-1.5 rounded-md border text-sm ${studyDays.includes(d.key) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800'}`}>{d.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-700">Duração mínima (min)</label>
                <Select value={String(minDur)} onValueChange={(v)=> setMinDur(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {minutesOptions().map(m => (<SelectItem key={m} value={String(m)}>{m} min</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Duração máxima (min)</label>
                <Select value={String(maxDur)} onValueChange={(v)=> setMaxDur(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {minutesOptions().map(m => (<SelectItem key={m} value={String(m)} disabled={m < minDur}>{m} min</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Data da prova (opcional)</label>
                <Input type="date" value={examDate} onChange={(e)=> setExamDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleFinish} disabled={loading || config.length===0}>{initialPlan? 'Concluir' : 'Concluir'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}