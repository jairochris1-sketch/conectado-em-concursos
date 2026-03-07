import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const dayOrder = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayLabel = { sunday:"DOM", monday:"SEG", tuesday:"TER", wednesday:"QUA", thursday:"QUI", friday:"SEX", saturday:"SÁB" };

export default function HoursStep({ value = {}, onChange, weeklyHours, setWeeklyHours, min=45, setMin, max=90, setMax }) {
  const selectedDays = useMemo(() => dayOrder.filter((d) => (value?.[d]||0) > 0), [value]);
  const suggestions = useMemo(() => {
    const days = selectedDays.length || 1;
    const perDay = Math.round(((weeklyHours||0) / days) * 100) / 100;
    return perDay;
  }, [weeklyHours, selectedDays]);

  const setDay = (d, hours) => {
    const h = Math.max(0, Number(hours)||0);
    onChange({ ...(value||{}), [d]: h });
  };

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Horas por Dia e Sessões</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-sm">Horas na semana:</div>
          <Input type="number" min={0} step="0.5" value={weeklyHours} onChange={(e)=>setWeeklyHours(Number(e.target.value)||0)} className="w-24"/>
          <div className="text-xs text-gray-500">Sugestão/dia: {suggestions.toFixed(2)}h</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dayOrder.map((d)=> (
            <div key={d} className="rounded-lg border p-3 bg-white dark:bg-slate-900">
              <div className="text-xs text-gray-500 mb-1">{dayLabel[d]}</div>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} step="0.5" value={value?.[d]||0} onChange={(e)=>setDay(d, e.target.value)} className="w-20"/>
                <button type="button" className="text-xs px-2 py-1 rounded border" onClick={()=>setDay(d, suggestions)}>
                  Sugerir
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <div className="text-sm">Sessão mínima (min):</div>
          <Input type="number" min={15} step="5" value={min} onChange={(e)=>setMin(Number(e.target.value)||15)} className="w-24"/>
          <div className="text-sm">Sessão máxima (min):</div>
          <Input type="number" min={min} step="5" value={max} onChange={(e)=>setMax(Number(e.target.value)||90)} className="w-24"/>
        </div>
      </CardContent>
    </Card>
  );
}