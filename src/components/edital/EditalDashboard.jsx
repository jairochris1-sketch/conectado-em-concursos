import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Target,
  CheckCircle2,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Award,
  TrendingUp
} from "lucide-react";

export default function EditalDashboard({ edital }) {
  if (!edital.processed || !edital.subjects_content) {
    return null;
  }

  const data = edital.subjects_content;
  const requisitos = edital.requisitos || {};
  const fases = edital.fases_concurso || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {data.disciplinas?.length || 0}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">Disciplinas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              {edital.total_topics || 0}
            </p>
            <p className="text-xs text-green-600 dark:text-green-300">Tópicos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {edital.total_subtopics || 0}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-300">Sub-tópicos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {edital.compatible_questions_count || 0}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-300">Questões</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações Gerais */}
      {data.informacoes_gerais && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-blue-600" />
              Informações Gerais do Concurso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.informacoes_gerais.vagas && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vagas</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {data.informacoes_gerais.vagas}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.nivel && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nível</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {data.informacoes_gerais.nivel}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.banca && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Banca</p>
                    <p className="font-semibold text-gray-900 dark:text-white uppercase">
                      {data.informacoes_gerais.banca}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.salario && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Salário</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {data.informacoes_gerais.salario}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.inscricoes && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inscrições</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {data.informacoes_gerais.inscricoes}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.data_prova && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Data da Prova</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {data.informacoes_gerais.data_prova}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.tipo_questoes && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Questões</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {data.informacoes_gerais.tipo_questoes}
                    </p>
                  </div>
                </div>
              )}
              {data.informacoes_gerais.numero_questoes && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nº de Questões</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {data.informacoes_gerais.numero_questoes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requisitos */}
      {requisitos && (requisitos.formacao || requisitos.experiencia || requisitos.outros?.length > 0) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Requisitos do Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {requisitos.formacao && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    📚 Formação:
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {requisitos.formacao}
                  </p>
                </div>
              )}
              {requisitos.experiencia && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    💼 Experiência:
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {requisitos.experiencia}
                  </p>
                </div>
              )}
              {requisitos.outros && requisitos.outros.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ✅ Outros Requisitos:
                  </p>
                  <ul className="space-y-2">
                    {requisitos.outros.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex-1">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fases do Concurso */}
      {fases && fases.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-purple-600" />
              Fases do Concurso
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {fases.map((fase, idx) => (
                <div key={idx} className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {idx + 1}. {fase.nome}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fase.tipo && (
                          <Badge variant="secondary" className="text-xs">
                            {fase.tipo}
                          </Badge>
                        )}
                        {fase.carater && (
                          <Badge 
                            variant={fase.carater.includes('eliminatoria') ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {fase.carater}
                          </Badge>
                        )}
                        {fase.peso && (
                          <Badge variant="outline" className="text-xs">
                            Peso: {fase.peso}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Programático Granular */}
      {data.disciplinas && data.disciplinas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
              Conteúdo Programático Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {data.disciplinas.map((disc, idx) => (
                <div key={idx} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                    {disc.nome}
                  </h4>
                  
                  {disc.topicos && Array.isArray(disc.topicos) && disc.topicos.length > 0 && (
                    <div className="space-y-3">
                      {disc.topicos.map((top, topIdx) => (
                        <div key={topIdx} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          {typeof top === 'string' ? (
                            <p className="text-gray-800 dark:text-gray-200">• {top}</p>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                • {top.nome}
                              </p>
                              {top.subtopicos && top.subtopicos.length > 0 && (
                                <ul className="ml-6 space-y-1">
                                  {top.subtopicos.map((sub, subIdx) => (
                                    <li key={subIdx} className="text-sm text-gray-700 dark:text-gray-300">
                                      ◦ {sub}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}