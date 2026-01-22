import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  Calendar, 
  BookOpen, 
  Lightbulb, 
  AlertTriangle 
} from "lucide-react";

export default function EditalAIAnalysis({ analysis }) {
  if (!analysis) return null;

  const getPesoColor = (peso) => {
    const pesoLower = peso?.toLowerCase() || '';
    if (pesoLower.includes('alto')) return 'bg-red-100 text-red-800';
    if (pesoLower.includes('médio') || pesoLower.includes('medio')) return 'bg-yellow-100 text-yellow-800';
    if (pesoLower.includes('baixo')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <FileText className="w-5 h-5" />
            Resumo Geral do Edital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {analysis.resumo_geral}
          </p>
        </CardContent>
      </Card>

      {/* Requisitos e Atribuições */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Requisitos Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.requisitos_principais?.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Briefcase className="w-5 h-5" />
              Atribuições do Cargo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.atribuicoes_cargo?.map((atrib, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{atrib}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Fases e Datas */}
      {analysis.fases_e_datas && analysis.fases_e_datas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Calendar className="w-5 h-5" />
              Fases do Concurso e Datas Cruciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.fases_e_datas.map((fase, idx) => (
                <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {fase.fase}
                    </h4>
                    {fase.peso && (
                      <Badge variant="outline" className="text-xs">
                        Peso: {fase.peso}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {fase.descricao}
                  </p>
                  {fase.data_prevista && (
                    <p className="text-xs text-orange-600 font-medium">
                      📅 {fase.data_prevista}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matérias Prioritárias */}
      {analysis.materias_prioritarias && analysis.materias_prioritarias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <BookOpen className="w-5 h-5" />
              Matérias Prioritárias para Estudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.materias_prioritarias.map((materia, idx) => (
                <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">
                      {materia.materia}
                    </h4>
                    <Badge className={getPesoColor(materia.peso_estimado)}>
                      {materia.peso_estimado}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {materia.justificativa}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de Preparação */}
      {analysis.dicas_preparacao && analysis.dicas_preparacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Lightbulb className="w-5 h-5" />
              Dicas de Preparação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.dicas_preparacao.map((dica, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{dica}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pontos de Atenção */}
      {analysis.pontos_atencao && analysis.pontos_atencao.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.pontos_atencao.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{ponto}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}