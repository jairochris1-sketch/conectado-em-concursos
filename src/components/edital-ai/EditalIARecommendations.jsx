import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, FileQuestion } from "lucide-react";

export default function EditalIARecommendations({ recommendations, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-600">Buscando questões mais compatíveis com cada tópico...</CardContent>
      </Card>
    );
  }

  if (!recommendations?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-purple-600" />
          Questões recomendadas por conteúdo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.map((discipline) => (
          <div key={discipline.subject_key} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{discipline.subject_label}</h3>
              <p className="text-sm text-slate-500">{discipline.topic_recommendations.length} tópicos com questões sugeridas</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {discipline.topic_recommendations.map((topic) => (
                <div key={`${discipline.subject_key}-${topic.topic_label}`} className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
                  <div>
                    <p className="font-medium text-slate-900">{topic.topic_label}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(topic.question_search_terms || []).slice(0, 4).map((term) => (
                        <Badge key={term} variant="outline">{term}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(topic.questions || []).length > 0 ? topic.questions.map((question) => (
                      <div key={question.id} className="rounded-xl bg-white border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-800 line-clamp-3">{question.statement || question.command || "Questão recomendada"}</p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                          <FileQuestion className="w-3 h-3" />
                          {question.institution || "Banca não informada"} {question.year ? `• ${question.year}` : ""}
                        </p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Nenhuma questão específica encontrada para este tópico no banco atual.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}