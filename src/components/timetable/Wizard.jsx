import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SubjectSelector from "./SubjectSelector";
import RelevanceStep from "./RelevanceStep";
import HoursStep from "./HoursStep";

const dayOrder = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function computeWeights(subjects, config) {
  const raw = subjects.map((s)=> ({ subject: s, importance: config[s]?.importance ?? 3, knowledge: config[s]?.knowledge ?? 3 }));
  const withScore = raw.map((r)=> ({...r, score: (r.importance||1) * (6 - (r.knowledge||3)) }));
  const total = withScore.reduce((a,b)=> a + (b.score||0), 0) || 1;
  return withScore.map((w)=> ({ ...w, weight: (w.score||0)/total }));
}

function generateWeekSchedule(subjectsWithWeights, weeklyHoursByDay, minMin, maxMin) {
  const schedule = [];
  const days = Object.keys(weeklyHoursByDay||{}).filter((d)=> (weeklyHoursByDay[d]||0) > 0);
  days.forEach((day) => {
    const dayMinutes = Math.round((weeklyHoursByDay[day]||0) * 60);
    let allocated = 0;
    subjectsWithWeights.forEach((sw, idx) => {
      let m = Math.round(dayMinutes * (sw.weight||0));
      if (m > 0 && m < minMin) m = Math.min(minMin, dayMinutes);
      if (m > maxMin) m = maxMin;
      if (m > 0) {
        schedule.push({ day_of_week: day, subject: sw.subject, duration_minutes: m, order: idx });
        allocated += m;
      }
    });
    // distribui resto para as maiores
    let rest = Math.max(0, dayMinutes - allocated);
    let i = 0;
    while (rest > 0 && i < subjectsWithWeights.length) {
      const idx = i % subjectsWithWeights.length;
      const can = Math.min(rest, maxMin - (schedule.find(s=> s.day_of_week===day && s.subject===subjectsWithWeights[idx].subject)?.duration_minutes||0));
      if (can > 0) {
        const it = schedule.find(s=> s.day_of_week===day && s.subject===subjectsWithWeights[idx].subject);
        if (it) { it.duration_minutes += can; rest -= can; }
      }
      i++;
    }
  });
  return schedule;
}

export default function TimetableWizard({ open, onOpenChange, initialPlan, onComplete }) {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState(initialPlan?.subjects_config?.map(s=>s.subject) || []);
  const [config, setConfig] = useState(()=>{
    const map = {};
    (initialPlan?.subjects_config||[]).forEach((c)=> { map[c.subject] = { importance: c.importance, knowledge: c.knowledge }; });
    return map;
  });
  const [weeklyHoursByDay, setWeeklyHoursByDay] = useState(initialPlan?.weekly_hours_by_day || {});
  const [weeklyHours, setWeeklyHours] = useState(()=> Object.values(initialPlan?.weekly_hours_by_day||{}).reduce((a,b)=> a + (b||0), 0));
  const [minMin, setMinMin] = useState(initialPlan?.session_min_minutes || 45);
  const [maxMin, setMaxMin] = useState(initialPlan?.session_max_minutes || 90);

  const weights = useMemo(()=> computeWeights(subjects, config), [subjects, config]);

  const handleFinish = () => {
    const subjects_config = weights.map((w)=> ({ subject: w.subject, importance: w.importance, knowledge: w.knowledge, weight: w.weight }));
    const generated_week_schedule = generateWeekSchedule(weights, weeklyHoursByDay, minMin, maxMin);
    onComplete({
      subjects_config,
      weekly_hours_by_day: weeklyHoursByDay,
      session_min_minutes: minMin,
      session_max_minutes: maxMin,
      generated_week_schedule,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar Cronograma</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-4">
            <SubjectSelector value={subjects} onChange={setSubjects} />
            <div className="flex justify-end"><Button onClick={()=> setStep(2)} disabled={!subjects.length}>Próximo</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <RelevanceStep subjects={subjects} config={config} onChange={setConfig} />
            <div className="flex justify-between"><Button variant="outline" onClick={()=> setStep(1)}>Voltar</Button><Button onClick={()=> setStep(3)}>Próximo</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <HoursStep value={weeklyHoursByDay} onChange={setWeeklyHoursByDay}
              weeklyHours={weeklyHours} setWeeklyHours={setWeeklyHours}
              min={minMin} setMin={setMinMin} max={maxMin} setMax={setMaxMin} />
            <div className="flex justify-between"><Button variant="outline" onClick={()=> setStep(2)}>Voltar</Button><Button onClick={handleFinish}>Concluir</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}