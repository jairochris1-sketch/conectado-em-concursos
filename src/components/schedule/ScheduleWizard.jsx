import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

const defaultSubjects = [
  "Língua Portuguesa",
  "Raciocínio Lógico",
  "Informática",
  "Direitos Humanos",
  "Legislação Especial",
  "Noções de Direito Administrativo",
  "Noções de Direito Constitucional",
  "Noções de Direito Penal e de Direito Processual Penal",
  "Contabilidade Geral",
  "Estatística"
];

// Helpers para extrair nomes legíveis de matérias
const isIdLike = (v) => typeof v === 'string' && /^[a-f0-9-]{16,36}$/i.test(v.trim());
const cleanLabel = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

const dayOptions = [
  { key: "sunday", label: "DOM" },
  { key: "monday", label: "SEG" },
  { key: "tuesday", label: "TER" },
  { key: "wednesday", label: "QUA" },
  { key: "thursday", label: "QUI" },
  { key: "friday", label: "SEX" },
  { key: "saturday", label: "SÁB" },
];

export default function ScheduleWizard({ initialSchedule, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [weights, setWeights] = useState({}); // { subject: { importance, knowledge } }
  const [dailyHours, setDailyHours] = useState({ // HH:MM by day
    sunday: "00:00",
    monday: "00:00",
    tuesday: "00:00",
    wednesday: "00:00",
    thursday: "00:00",
    friday: "00:00",
    saturday: "00:00",
  });
  const [minSession, setMinSession] = useState(45); // minutes
  const [maxSession, setMaxSession] = useState(90);
  const [topics, setTopics] = useState([]);
  const [subjectTopics, setSubjectTopics] = useState({});
  const [subjectKeyByLabel, setSubjectKeyByLabel] = useState({});
  const [title, setTitle] = useState(initialSchedule?.title || "Planejamento Semanal");
  const [period, setPeriod] = useState(() => {
    const start = nextWeekStart();
    const end = new Date(start); end.setDate(end.getDate() + 6);
    return { start: toDateInput(start), end: toDateInput(end) };
  });
  const [examDate, setExamDate] = useState(initialSchedule?.exam_date || "");
  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(examDate); if (isNaN(d)) return null; d.setHours(0,0,0,0);
    return Math.floor((d - today) / (1000*60*60*24));
  }, [examDate]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const list = await base44.entities.Subject?.list?.();
        const hex24 = /^[a-f0-9]{24}$/i; // id parecido com o da imagem
        const norm = (s) => (typeof s === 'string' ? s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim() : '');
        if (Array.isArray(list) && list.length > 0) {
          const labels = [];
          const map = {};
          list.forEach((s) => {
            const label = (s.name || s.title || s.label || s.display_name || s.nome || s.disciplina || s.materia || s.subject || "").toString().trim();
            if (!label || hex24.test(label) || label.length <= 1) return;
            const keyCandidate = s.value || s.slug || s.key || s.code || s.subject || label;
            const key = norm(String(keyCandidate));
            labels.push(label);
            map[label] = key;
          });
          const unique = Array.from(new Set(labels));
          setSubjects(unique.length > 0 ? unique : defaultSubjects);
          setSubjectKeyByLabel(map);
        } else {
          setSubjects(defaultSubjects);
          const map = Object.fromEntries(defaultSubjects.map((l) => [l, norm(l)]));
          setSubjectKeyByLabel(map);
        }
      } catch {
        setSubjects(defaultSubjects);
        const map = Object.fromEntries(defaultSubjects.map((l) => [l, l.toString().toLowerCase()]));
        setSubjectKeyByLabel(map);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.Topic?.list?.();
        setTopics(Array.isArray(list) ? list : []);
      } catch {
        setTopics([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialSchedule?.schedule_items?.length) {
      // Preselect subjects from existing schedule
      const uniq = Array.from(new Set(initialSchedule.schedule_items.map(i => i.subject).filter(Boolean)));
      setSelected(uniq);
      // Distribute equal defaults
      const next = {};
      uniq.forEach(s => { next[s] = { importance: 3, knowledge: 3 }; });
      setWeights(next);
      // Estimate daily hours from items (sum durations per day)
      const byDay = { ...dailyHours };
      Object.keys(byDay).forEach(d => byDay[d] = "00:00");
      const group = initialSchedule.schedule_items.reduce((acc, it) => {
        const m = diffMinutes(it.start_time, it.end_time);
        acc[it.day_of_week] = (acc[it.day_of_week] || 0) + (isNaN(m) ? 0 : m);
        return acc;
      }, {});
      Object.entries(group).forEach(([d, mins]) => byDay[d] = toHHMM(mins));
      setDailyHours(byDay);
      setPeriod({ start: initialSchedule.start_date, end: initialSchedule.end_date });
      setTitle(initialSchedule.title || title);
      setExamDate(initialSchedule.exam_date || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSchedule]);

  const totalWeekMinutes = useMemo(() => Object.values(dailyHours).reduce((sum, hhmm) => sum + hhmmToMinutes(hhmm), 0), [dailyHours]);

  const weightList = useMemo(() => {
    const rows = selected.map(s => ({
      subject: s,
      importance: weights[s]?.importance ?? 3,
      knowledge: weights[s]?.knowledge ?? 3,
    }));
    const withScore = rows.map(r => ({ ...r, score: r.importance * (6 - r.knowledge) }));
    const total = withScore.reduce((a, r) => a + (r.score || 0), 0) || 1;
    return withScore.map(r => ({ ...r, pct: Math.round((r.score / total) * 100) }));
  }, [selected, weights]);

  const normalize = (s) => (typeof s === 'string' ? s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim() : '');
  const topicsForLabel = (label) => {
    const mapped = subjectKeyByLabel[label];
    const subjectKey = normalize(mapped || label);
    let filtered = topics.filter((t) => normalize(t.subject || '') === subjectKey);
    if (!filtered.length) {
      const subjectKeys = Array.from(new Set(topics.map((t) => normalize(t.subject || '')).filter(Boolean)));
      const candidates = subjectKeys.filter((ts) => subjectKey.includes(ts) || ts.includes(subjectKey));
      if (candidates.length) {
        filtered = topics.filter((t) => candidates.includes(normalize(t.subject || '')));
      }
    }
    return filtered;
  };

  const handleToggleSubject = (s) => {
    setSelected(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s];
      setWeights(w => (w[s] ? w : { ...w, [s]: { importance: 3, knowledge: 3 } }));
      setSubjectTopics(st => {
        const copy = { ...st };
        if (next.includes(s) && !copy[s]) copy[s] = [];
        if (!next.includes(s)) delete copy[s];
        return copy;
      });
      return next;
    });
  };

  const next = () => setStep(prev => Math.min(4, prev + 1));
  const back = () => setStep(prev => Math.max(1, prev - 1));

  const finish = async () => {
    const items = generateScheduleItems({
      selected,
      weightList,
      dailyHours,
      minSession,
      maxSession,
      subjectTopics,
    });

    const payload = {
      title,
      description: "Gerado automaticamente pelo assistente",
      start_date: period.start,
      end_date: period.end,
      exam_date: examDate || undefined,
      schedule_items: items,
    };

    if (initialSchedule?.id) {
      await base44.entities.StudySchedule.update(initialSchedule.id, payload);
    } else {
      await base44.entities.StudySchedule.create(payload);
    }

    if (examDate) {
      const plans = await base44.entities.StudyCyclePlan.filter({ is_active: true });
      if (Array.isArray(plans) && plans.length > 0) {
        await base44.entities.StudyCyclePlan.update(plans[0].id, { exam_date: examDate });
      }
    }

    onComplete?.();
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Criar Planejamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Stepper step={step} />

        {step === 1 && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Semana 1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Início</label>
                  <Input type="date" value={period.start} onChange={(e) => setPeriod(p => ({ ...p, start: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Fim</label>
                  <Input type="date" value={period.end} onChange={(e) => setPeriod(p => ({ ...p, end: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Data da prova</label>
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  {daysLeft !== null && (
                    <div className="text-xs text-gray-600 mt-1">
                      {daysLeft > 0 ? `Faltam ${daysLeft} dias` : daysLeft === 0 ? 'Prova hoje' : `Prova ocorreu há ${Math.abs(daysLeft)} dias`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground">Organização básica do seu planejamento semanal.</div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <p className="text-foreground">Selecione suas disciplinas para este planejamento.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((s) => {
                const label = cleanLabel(s);
                if (!label || isIdLike(label)) return null;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleToggleSubject(label)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition ${selected.includes(label) ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-600' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-2 space-y-4">
              {selected.map((s) => (
                <div key={s} className="rounded-lg border p-4">
                  <div className="font-semibold mb-3">{s}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SliderField
                      label="Importância"
                      value={[weights[s]?.importance ?? 3]}
                      onChange={([v]) => setWeights(w => ({ ...w, [s]: { ...(w[s] || {}), importance: v } }))}
                      min={1}
                      max={5}
                    />
                    <SliderField
                      label="Conhecimento"
                      value={[weights[s]?.knowledge ?? 3]}
                      onChange={([v]) => setWeights(w => ({ ...w, [s]: { ...(w[s] || {}), knowledge: v } }))}
                      min={1}
                      max={5}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Assuntos</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-between w-full sm:w-auto">
                          {subjectTopics[s]?.length ? `${subjectTopics[s].length} selecionado(s)` : "Selecionar assuntos"}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <div className="max-h-60 overflow-auto space-y-2">
                          {(topicsForLabel(s) || []).map((t) => {
                            const val = t.label || t.value;
                            const checked = (subjectTopics[s] || []).includes(val);
                            return (
                              <label key={val} className="flex items-center gap-2 text-sm text-gray-700">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    setSubjectTopics(prev => {
                                      const arr = prev[s] ? [...prev[s]] : [];
                                      const isChecked = !!v;
                                      const i = arr.indexOf(val);
                                      if (isChecked && i === -1) arr.push(val);
                                      if (!isChecked && i > -1) arr.splice(i, 1);
                                      return { ...prev, [s]: arr };
                                    });
                                  }}
                                />
                                <span>{t.label || t.value}</span>
                              </label>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {subjectTopics[s]?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {subjectTopics[s].map((v) => (
                          <Badge key={v} variant="secondary">{v}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-800">
                <div className="font-semibold mb-2">Distribuição</div>
                <div className="space-y-2">
                  {weightList.map(r => (
                    <div key={r.subject} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{r.subject}</span>
                      <span className="text-sm font-semibold">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 mt-4">
            <div>
              <div className="text-gray-700 font-medium mb-3">Quais dias e quantas horas pretende estudar?</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayOptions.map((d) => (
                  <div key={d.key} className="flex items-center justify-between rounded-lg border p-3 bg-white dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hhmmToMinutes(dailyHours[d.key]) > 0}
                        onChange={(e) => setDailyHours(h => ({ ...h, [d.key]: e.target.checked ? '01:00' : '00:00' }))}
                      />
                      <span className="text-sm font-medium w-10">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-24"
                        placeholder="HH:MM"
                        value={dailyHours[d.key]}
                        onChange={(e) => setDailyHours(h => ({ ...h, [d.key]: sanitizeHHMM(e.target.value) }))}
                      />
                      <span className="text-sm text-gray-500">horas diárias</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right text-sm text-foreground">Total na semana: <strong>{toHHMM(totalWeekMinutes)}</strong></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tempo mínimo por sessão</label>
                <SelectNumber value={minSession} onChange={setMinSession} options={[30, 45, 60, 75, 90]} suffix="min" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tempo máximo por sessão</label>
                <SelectNumber value={maxSession} onChange={setMaxSession} options={[60, 75, 90, 105, 120]} suffix="min" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : back}>Voltar</Button>
          <div className="flex gap-2">
            {step < 4 && <Button onClick={next}>Próximo</Button>}
            {step === 4 && <Button onClick={finish}>Concluir</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stepper({ step }) {
  const items = ["Organização", "Disciplinas", "Relevância", "Horários"];
  return (
    <div className="flex items-center justify-between">
      {items.map((label, idx) => {
        const n = idx + 1; const active = n <= step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'}`}>{n.toString().padStart(2, '0')}</div>
            <div className={`text-sm ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-300'}`}>{label}</div>
            {idx < items.length - 1 && <div className={`w-10 h-[2px] ${active ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <Slider value={value} onValueChange={onChange} min={min} max={max} step={1} />
      <div className="text-xs text-gray-600 mt-1">{value?.[0] ?? 0}</div>
    </div>
  );
}

function SelectNumber({ value, onChange, options, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded-md px-2 py-1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="text-sm text-gray-600">{suffix}</span>
    </div>
  );
}

// Helpers
function hhmmToMinutes(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return 0;
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}
function toHHMM(mins) {
  const h = Math.floor((mins || 0) / 60); const m = (mins || 0) % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function addMinutesToTime(startHHMM, delta) {
  const [h, m] = startHHMM.split(":").map(n => parseInt(n, 10));
  const base = new Date(2000,0,1,h||0,m||0,0,0);
  base.setMinutes(base.getMinutes() + delta);
  return `${String(base.getHours()).padStart(2,'0')}:${String(base.getMinutes()).padStart(2,'0')}`;
}
function sanitizeHHMM(str) {
  const v = str.replace(/[^0-9:]/g, '').slice(0,5);
  const parts = v.split(":");
  let hh = parts[0] || "00"; let mm = parts[1] || "00";
  hh = String(Math.min(23, parseInt(hh || '0',10))).padStart(2,'0');
  mm = String(Math.min(59, parseInt(mm || '0',10))).padStart(2,'0');
  return `${hh}:${mm}`;
}
function nextWeekStart() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (7 - day) % 7; // days until next Sunday
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0,0,0,0);
  return start;
}
function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function diffMinutes(a, b) {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return (bh*60+bm) - (ah*60+am);
}

function generateScheduleItems({ selected, weightList, dailyHours, minSession, maxSession, subjectTopics }) {
  const selectedWeights = weightList.filter(w => selected.includes(w.subject));
  const totalMinutes = Object.values(dailyHours).reduce((s, v) => s + hhmmToMinutes(v), 0);
  const sumScore = selectedWeights.reduce((s, w) => s + w.score, 0) || 1;

  // Build sessions pool per subject
  const sessions = [];
  selectedWeights.forEach(w => {
    const target = Math.round((w.score / sumScore) * totalMinutes);
    let rem = target;
    while (rem > 0) {
      const chunk = Math.min(Math.max(minSession, 1), Math.min(maxSession, rem));
      sessions.push({ subject: w.subject, duration: chunk });
      rem -= chunk;
    }
  });

  // Distribute to days
  const dayKeys = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const items = [];
  let poolIdx = 0;
  const topicIndex = {};
  dayKeys.forEach(day => {
    let rem = hhmmToMinutes(dailyHours[day]);
    if (rem <= 0) return;
    let t = "08:00"; // start of day default
    while (rem > 0 && poolIdx < sessions.length) {
      const s = sessions[poolIdx];
      const use = Math.min(s.duration, rem);
      const end = addMinutesToTime(t, use);
      const list = (subjectTopics && subjectTopics[s.subject]) || [];
      const idx = topicIndex[s.subject] || 0;
      const chosenTopic = list.length ? list[idx % list.length] : "";
      topicIndex[s.subject] = idx + 1;
      items.push({
        day_of_week: day,
        start_time: t,
        end_time: end,
        subject: s.subject,
        topic: chosenTopic,
        activity_type: "teoria"
      });
      t = end;
      rem -= use;
      poolIdx++;
    }
  });
  return items;
}