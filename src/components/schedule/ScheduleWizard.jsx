import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const SUBJECTS = [
  "Contabilidade Geral",
  "Direitos Humanos",
  "Estatística",
  "Informática",
  "Legislação Especial",
  "Língua Portuguesa",
  "Noções de Direito Administrativo",
  "Noções de Direito Constitucional",
  "Noções de Direito Penal e de Direito Processual Penal",
  "Raciocínio Lógico",
];

const DAYS = [
  { key: "sunday", label: "DOM" },
  { key: "monday", label: "SEG" },
  { key: "tuesday", label: "TER" },
  { key: "wednesday", label: "QUA" },
  { key: "thursday", label: "QUI" },
  { key: "friday", label: "SEX" },
  { key: "saturday", label: "SÁB" },
];

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(timeHHMM, minutes) {
  const [h, m] = timeHHMM.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export default function ScheduleWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("Planejamento Semanal");
  const [selected, setSelected] = useState([]); // subject names
  const [weights, setWeights] = useState({}); // subj -> {importance, knowledge}
  const [dayConfig, setDayConfig] = useState(() => {
    const init = {};
    DAYS.forEach((d) => {
      init[d.key] = { active: ["monday","tuesday","wednesday","thursday","friday"].includes(d.key), hhmm: ["saturday","sunday"].includes(d.key) ? "00:00" : "04:00" };
    });
    return init;
  });
  const [minSession, setMinSession] = useState(45);
  const [maxSession, setMaxSession] = useState(90);

  const normalized = useMemo(() => {
    const entries = selected.map((s) => {
      const imp = weights[s]?.importance ?? 3;
      const know = weights[s]?.knowledge ?? 3;
      return [s, Math.max(0, imp * (6 - know))];
    });
    const sum = entries.reduce((a, [, w]) => a + w, 0) || 1;
    return Object.fromEntries(entries.map(([s, w]) => [s, w / sum]));
  }, [selected, weights]);

  const weeklyMinutes = useMemo(() => {
    return DAYS.reduce((sum, d) => sum + (dayConfig[d.key].active ? hhmmToMinutes(dayConfig[d.key].hhmm) : 0), 0);
  }, [dayConfig]);

  const subjectPercents = useMemo(() => {
    return selected.map((s) => ({ subject: s, percent: Math.round((normalized[s] || 0) * 100) }));
  }, [selected, normalized]);

  const canNext = () => {
    if (step === 1) return selected.length > 0;
    if (step === 2) return selected.length > 0; // sliders always set
    if (step === 3) return weeklyMinutes > 0 && minSession > 0 && maxSession >= minSession;
    return true;
  };

  const toggleSubject = (s) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    setWeights((prev) => (prev[s] ? prev : { ...prev, [s]: { importance: 3, knowledge: 3 } }));
  };

  const suggestionOptions = ["02:00", "03:00", "04:00", "05:00"]; // per-day suggestions

  const handleFinish = async () => {
    // Build StudySchedule payload
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    // Compute subject weekly quotas (minutes)
    const totalWeekMin = weeklyMinutes || 1;
    const quotas = Object.fromEntries(selected.map((s) => [s, Math.round(totalWeekMin * (normalized[s] || 0))]));

    // Distribute across days and create sessions respecting min/max
    const dayOrder = DAYS.map((d) => d.key);
    const schedule_items = [];

    const sessionLen = Math.min(Math.max(minSession, 30), Math.max(maxSession, minSession));

    const nextSubject = () => {
      let best = null, max = -1;
      for (const s of selected) {
        if ((quotas[s] || 0) > max) { max = quotas[s]; best = s; }
      }
      return best;
    };

    for (const day of dayOrder) {
      if (!dayConfig[day].active) continue;
      let remaining = hhmmToMinutes(dayConfig[day].hhmm);
      let current = "08:00";
      let guard = 0;
      while (remaining > 0 && guard < 1000) {
        guard++;
        const s = nextSubject();
        if (!s || quotas[s] <= 0) break;
        const chunk = Math.min(sessionLen, remaining, quotas[s]);
        const endTime = addMinutes(current, chunk);
        schedule_items.push({
          day_of_week: day,
          start_time: current,
          end_time: endTime,
          subject: s,
          topic: "",
          activity_type: "teoria",
        });
        quotas[s] -= chunk;
        remaining -= chunk;
        current = endTime;
      }
    }

    const payload = {
      title: title || "Planejamento Semanal",
      description: `Gerado automaticamente pelo assistente com ${selected.length} disciplinas e ${Math.round(weeklyMinutes/60)}h/semana`,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      schedule_items,
    };

    await base44.entities.StudySchedule.create(payload);
    onComplete && onComplete();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Criar Planejamento</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step>=i? 'bg-emerald-500 text-white':'bg-gray-200 text-gray-600'}`}>{String(i).padStart(2,'0')}</div>
              {i<4 && <div className={`h-1 flex-1 rounded ${step>i? 'bg-emerald-500':'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Título</label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex: Reta Final – Semana 1" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Selecione quais disciplinas deseja colocar no seu planejamento.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUBJECTS.map((s) => {
                const active = selected.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition ${active ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {selected.map((s) => (
                <div key={s} className="p-4 rounded-lg border bg-gray-50">
                  <div className="font-semibold text-gray-900 mb-3">{s}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Importância</div>
                      <Slider
                        value={[weights[s]?.importance ?? 3]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([v]) => setWeights((prev) => ({ ...prev, [s]: { ...(prev[s]||{}), importance: v } }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Conhecimento</div>
                      <Slider
                        value={[weights[s]?.knowledge ?? 3]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([v]) => setWeights((prev) => ({ ...prev, [s]: { ...(prev[s]||{}), knowledge: v } }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Distribuição estimada de tempo:</div>
              <div className="space-y-2">
                {subjectPercents.map((it) => (
                  <div key={it.subject} className="flex items-center gap-2">
                    <div className="w-24 text-sm text-gray-700">{it.subject.split(' ')[0]}</div>
                    <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${it.percent}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{it.percent}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAYS.map((d) => {
                const cfg = dayConfig[d.key];
                return (
                  <div key={d.key} className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">{d.label}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>Ativo</span>
                        <Switch checked={cfg.active} onCheckedChange={(v)=>setDayConfig((p)=>({ ...p, [d.key]: { ...p[d.key], active: v } }))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Input type="time" step={900} value={cfg.hhmm} onChange={(e)=>setDayConfig((p)=>({ ...p, [d.key]: { ...p[d.key], hhmm: e.target.value } }))} className="w-32" />
                      <div className="flex items-center gap-2">
                        {suggestionOptions.map((opt)=> (
                          <button key={opt} type="button" className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50" onClick={()=>setDayConfig((p)=>({ ...p, [d.key]: { ...p[d.key], hhmm: opt, active: true } }))}>{opt}</button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">horas diárias</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">Duração mínima por sessão</div>
                <Select value={String(minSession)} onValueChange={(v)=>setMinSession(Number(v))}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[30,45,60,75,90].map((m)=> (<SelectItem key={m} value={String(m)}>{m} min</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">Duração máxima por sessão</div>
                <Select value={String(maxSession)} onValueChange={(v)=>setMaxSession(Number(v))}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[60,75,90,105,120].map((m)=> (<SelectItem key={m} value={String(m)}>{m} min</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">Total na semana: <Badge variant="secondary">{Math.floor(weeklyMinutes/60)}h{String(weeklyMinutes%60).padStart(2,'0')}min</Badge></div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm text-gray-700">
            <div><span className="font-semibold">Título:</span> {title}</div>
            <div><span className="font-semibold">Disciplinas:</span> {selected.join(", ")}</div>
            <div><span className="font-semibold">Carga semanal:</span> {Math.floor(weeklyMinutes/60)}h {weeklyMinutes%60}min</div>
            <div className="text-xs text-gray-500">Ao concluir, o cronograma semanal será criado e ficará disponível na lista.</div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>Voltar</Button>
          <div className="flex gap-2">
            {step>1 && <Button variant="outline" onClick={()=>setStep((s)=>s-1)}>Anterior</Button>}
            {step<4 && <Button disabled={!canNext()} onClick={()=>setStep((s)=>s+1)}>Próximo</Button>}
            {step===4 && <Button onClick={handleFinish}>Concluir</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}