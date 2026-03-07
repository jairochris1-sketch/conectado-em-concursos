import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, format } from "date-fns";

const dayOrder = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

export default function MonthlyView({ plan }) {
  const today = new Date();
  const start = startOfWeek(startOfMonth(today), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(today), { weekStartsOn: 0 });

  const itemsByDow = Object.fromEntries(dayOrder.map((d)=>[d, []]));
  (plan?.generated_week_schedule||[]).forEach((it)=> itemsByDow[it.day_of_week]?.push(it));

  const cells = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const dow = dayOrder[d.getDay()];
    const isInMonth = isSameMonth(d, today);
    cells.push({ date: new Date(d), dow, isInMonth, items: itemsByDow[dow]||[] });
  }

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Planejamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-xs">
          {cells.map((c, idx)=> (
            <div key={idx} className={`rounded-lg border p-2 ${c.isInMonth?"bg-white dark:bg-slate-900":"bg-gray-50 dark:bg-slate-800/50"}`}>
              <div className="text-[10px] text-gray-500 mb-1">{format(c.date, 'd')}</div>
              <div className="space-y-1">
                {c.items.map((it, i)=> (
                  <div key={i} className="rounded border p-1 flex justify-between">
                    <span className="truncate">{it.subject}</span>
                    <span className="text-gray-500">{Math.round(it.duration_minutes)}m</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}