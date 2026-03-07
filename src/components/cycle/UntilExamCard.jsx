import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UntilExamCard({ plan, onEditClick }) {
  const stats = useMemo(() => {
    const exam = plan?.exam_date ? new Date(plan.exam_date) : null;
    if (!exam || isNaN(exam.getTime())) return null;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(exam.getFullYear(), exam.getMonth(), exam.getDate());
    const ms = end.getTime() - start.getTime();
    const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const weeks = Math.max(0, Math.ceil(days / 7));
    const sessionsPerWeek = (plan?.study_days || []).length;
    const sessionsTotal = weeks * sessionsPerWeek;
    const totalMinutes = weeks * (plan?.weekly_hours || 0) * 60;
    return { days, weeks, sessionsPerWeek, sessionsTotal, totalMinutes };
  }, [plan]);

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Até a prova</CardTitle>
      </CardHeader>
      <CardContent>
        {!stats ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Defina a data da prova nas configurações do ciclo para ver os cálculos.
            {onEditClick && (
              <Button variant="outline" size="sm" className="ml-2" onClick={onEditClick}>Editar planejamento</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500">Dias restantes</div>
              <div className="text-2xl font-bold">{stats.days}</div>
            </div>
            <div className="rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500">Semanas</div>
              <div className="text-2xl font-bold">{stats.weeks}</div>
            </div>
            <div className="rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500">Sessões/semana</div>
              <div className="text-2xl font-bold">{stats.sessionsPerWeek}</div>
            </div>
            <div className="rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500">Sessões previstas</div>
              <div className="text-2xl font-bold">{stats.sessionsTotal}</div>
            </div>
            <div className="col-span-2 rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500">Tempo total disponível</div>
              <div className="text-xl font-semibold">{Math.floor(stats.totalMinutes/60)}h {stats.totalMinutes%60}min</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}