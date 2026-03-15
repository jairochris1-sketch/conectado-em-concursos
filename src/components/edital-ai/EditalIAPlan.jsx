import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3 } from "lucide-react";

const blockStyles = {
  teoria: "bg-blue-100 text-blue-700",
  questoes: "bg-purple-100 text-purple-700",
  revisao: "bg-emerald-100 text-emerald-700"
};

export default function EditalIAPlan({ weeklyPlan }) {
  if (!weeklyPlan?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Cronograma verticalizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {weeklyPlan.map((week) => (
            <div key={week.week} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Semana {week.week}</h3>
                <p className="text-sm text-slate-600">{week.goal}</p>
              </div>
              <div className="space-y-3">
                {(week.sessions || []).map((session, index) => (
                  <div key={`${week.week}-${index}`} className="rounded-xl bg-white p-3 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-slate-900">{session.day_label}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={blockStyles[session.block_type] || "bg-slate-100 text-slate-700"}>{session.block_type}</Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock3 className="w-3 h-3" />{session.duration_minutes} min</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{session.subject_label}</p>
                    <p className="text-sm text-slate-700">{session.topic_label}</p>
                    <p className="text-xs text-slate-500 mt-1">{session.objective}</p>
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