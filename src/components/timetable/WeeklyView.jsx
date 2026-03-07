import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dayOrder = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayLabelFull = { sunday:"Dom", monday:"Seg", tuesday:"Ter", wednesday:"Qua", thursday:"Qui", friday:"Sex", saturday:"Sáb" };

export default function WeeklyView({ plan }) {
  const grouped = useMemo(() => {
    const map = Object.fromEntries(dayOrder.map((d)=>[d, []]));
    (plan?.generated_week_schedule||[]).forEach((it)=> { map[it.day_of_week]?.push(it); });
    Object.values(map).forEach(list => list.sort((a,b)=> (a.order||0) - (b.order||0)));
    return map;
  }, [plan]);

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Planejamento Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {dayOrder.map((d)=> (
            <div key={d} className="rounded-lg border bg-white dark:bg-slate-900 p-2">
              <div className="text-xs text-gray-500 mb-1">{dayLabelFull[d]}</div>
              <div className="space-y-2">
                {(grouped[d]||[]).map((it, idx)=> (
                  <div key={idx} className="rounded-md border p-2 text-xs flex items-center justify-between" style={{backgroundColor:"white"}}>
                    <span className="font-medium">{it.subject}</span>
                    <span className="text-gray-500">{Math.round(it.duration_minutes)}min</span>
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