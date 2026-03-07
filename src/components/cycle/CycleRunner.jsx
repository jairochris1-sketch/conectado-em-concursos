import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CycleRunner({ cycle }) {
  const items = useMemo(() => cycle?.items || [], [cycle]);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const target = (items[index]?.duration_minutes || 0) * 60;
  const current = items[index];
  const intervalRef = useRef(null);

  useEffect(() => {
    // reset when index changes
    setElapsed(0);
  }, [index]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const next = () => {
    setRunning(false);
    setElapsed(0);
    if (items.length === 0) return;
    setIndex((i) => (i + 1) % items.length);
  };

  const saveAndNext = async () => {
    if (!current) return next();
    const seconds = elapsed > 0 ? Math.min(elapsed, target || elapsed) : 0;
    if (seconds > 0) {
      await base44.entities.StudyRecord.create({
        study_date: new Date().toISOString().slice(0, 10),
        subject: current.subject,
        content_title: `Ciclo: ${current.subject}`,
        notes: "Registro automático do Ciclo de Estudos",
        study_type: "Teoria",
        duration_seconds: seconds,
        completed: seconds >= target && target > 0,
        review_enabled: false
      });
    }
    next();
  };

  const pct = target > 0 ? Math.min(100, Math.round((elapsed / target) * 100)) : 0;

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60">
      <CardHeader>
        <CardTitle>Ciclo em Execução</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {current ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Disciplina da vez</p>
                <h3 className="text-2xl font-bold">{current.subject}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 flex items-center gap-1 justify-end"><Clock className="w-4 h-4" /> Meta: {items[index].duration_minutes} min</p>
                <p className="font-semibold">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</p>
              </div>
            </div>

            <Progress value={pct} />

            <div className="flex gap-2">
              {!running ? (
                <Button onClick={() => setRunning(true)} className="gap-2"><Play className="w-4 h-4" /> Iniciar</Button>
              ) : (
                <Button variant="outline" onClick={() => setRunning(false)} className="gap-2"><Pause className="w-4 h-4" /> Pausar</Button>
              )}
              <Button variant="secondary" onClick={next} className="gap-2"><SkipForward className="w-4 h-4" /> Pular</Button>
              <Button variant="default" onClick={saveAndNext} className="gap-2"><CheckCircle2 className="w-4 h-4" /> Concluir</Button>
            </div>

            {items.length > 1 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Próximas: {items.slice(index+1).concat(items.slice(0, index)).map(i => i.subject).join(" • ")}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Adicione disciplinas ao ciclo para começar.</p>
        )}
      </CardContent>
    </Card>
  );
}