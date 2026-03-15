import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Layers3, Target } from "lucide-react";

const priorityStyles = {
  alta: "bg-red-100 text-red-700",
  media: "bg-yellow-100 text-yellow-700",
  baixa: "bg-green-100 text-green-700"
};

export default function EditalIAOverview({ analysis }) {
  if (!analysis) return null;

  const totalTopics = (analysis.disciplines || []).reduce((sum, discipline) => sum + (discipline.topics?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-blue-600" /><div><p className="text-sm text-slate-500">Disciplinas</p><p className="text-2xl font-bold">{analysis.disciplines?.length || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><Layers3 className="w-5 h-5 text-indigo-600" /><div><p className="text-sm text-slate-500">Tópicos</p><p className="text-2xl font-bold">{totalTopics}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-emerald-600" /><div><p className="text-sm text-slate-500">Semanas sugeridas</p><p className="text-2xl font-bold">{analysis.weekly_plan?.length || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><Target className="w-5 h-5 text-orange-600" /><div><p className="text-sm text-slate-500">Estratégia</p><p className="text-sm font-semibold">{analysis.study_strategy || "Plano priorizado"}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do edital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 leading-relaxed">{analysis.edital_summary}</p>
          <div className="flex flex-wrap gap-2">
            {(analysis.disciplines || []).map((discipline) => (
              <Badge key={`${discipline.subject_key}-${discipline.subject_label}`} className={priorityStyles[discipline.priority] || "bg-slate-100 text-slate-700"}>
                {discipline.subject_label} • {discipline.priority}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}