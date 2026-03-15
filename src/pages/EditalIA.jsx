import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import EditalIAUploadForm from "../components/edital-ai/EditalIAUploadForm";
import EditalIAOverview from "../components/edital-ai/EditalIAOverview";
import EditalIAPlan from "../components/edital-ai/EditalIAPlan";
import EditalIARecommendations from "../components/edital-ai/EditalIARecommendations";

const SUBJECT_KEYS = [
  "portugues", "matematica", "raciocinio_logico", "informatica", "tecnologia_informacao",
  "conhecimentos_gerais", "direito_constitucional", "direito_administrativo", "direito_penal",
  "direito_civil", "direito_tributario", "direito_previdenciario", "direito_eleitoral",
  "direito_ambiental", "direito_trabalho", "direito_processual_penal", "administracao_geral",
  "administracao_publica", "afo", "gestao_pessoas", "administracao_recursos_materiais",
  "arquivologia", "financas_publicas", "etica_administracao", "atendimento_publico",
  "comunicacao_social", "direitos_humanos", "eca", "contabilidade", "economia", "estatistica",
  "pedagogia", "educacao_fisica", "ingles", "seguranca_publica", "lei_8112", "lei_8666",
  "lei_14133", "constituicao_federal", "regimento_interno", "legislacao_especifica",
  "legislacao_estadual", "legislacao_municipal"
];

const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getQuestionScore = (question, topic) => {
  const haystack = normalizeText([
    question.statement,
    question.command,
    question.associated_text,
    question.topic,
    question.explanation
  ].filter(Boolean).join(" "));

  const terms = [topic.topic_label, ...(topic.question_search_terms || [])]
    .map(normalizeText)
    .filter(Boolean);

  return terms.reduce((score, term) => {
    if (haystack.includes(term)) return score + 3;
    const pieces = term.split(" ").filter((piece) => piece.length > 3);
    return score + pieces.filter((piece) => haystack.includes(piece)).length;
  }, 0);
};

const buildRecommendations = async (disciplines) => {
  const uniqueSubjects = [...new Set((disciplines || []).map((item) => item.subject_key).filter(Boolean))];
  const pools = await Promise.all(
    uniqueSubjects.map(async (subjectKey) => {
      const questions = await base44.entities.Question.filter({ subject: subjectKey }, "-created_date", 80);
      return [subjectKey, questions || []];
    })
  );

  const questionsBySubject = Object.fromEntries(pools);

  return (disciplines || []).map((discipline) => ({
    subject_key: discipline.subject_key,
    subject_label: discipline.subject_label,
    topic_recommendations: (discipline.topics || []).map((topic) => {
      const subjectQuestions = questionsBySubject[discipline.subject_key] || [];
      const ranked = subjectQuestions
        .map((question) => ({ question, score: getQuestionScore(question, topic) }))
        .sort((a, b) => b.score - a.score)
        .map((item) => item.question);

      const questions = ranked.filter((question, index, array) => index === array.findIndex((candidate) => candidate.id === question.id)).slice(0, 2);

      return {
        topic_label: topic.topic_label,
        question_search_terms: topic.question_search_terms || [],
        questions
      };
    })
  }));
};

export default function EditalIA() {
  const [form, setForm] = useState({
    contestName: "",
    role: "",
    examDate: "",
    weeklyHours: 12,
    studyDays: 5
  });
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (nextFile.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF válido.");
      return;
    }

    setFile(nextFile);
    setAnalysis(null);
    setRecommendations([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Selecione um PDF do edital.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setRecommendations([]);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o PDF de edital enviado e devolva uma estrutura de estudo objetiva para concursos.

Dados do usuário:
- Concurso: ${form.contestName || "Não informado"}
- Cargo: ${form.role || "Não informado"}
- Data da prova: ${form.examDate || "Não informada"}
- Horas de estudo por semana: ${form.weeklyHours}
- Dias de estudo por semana: ${form.studyDays}

Regras obrigatórias:
1. Extraia as disciplinas e tópicos realmente cobrados no edital.
2. Organize a resposta em formato prático para estudo verticalizado.
3. Gere um cronograma semanal com sessões distribuídas conforme a carga horária informada.
4. Para subject_key, use apenas um destes valores quando fizer sentido: ${SUBJECT_KEYS.join(", ")}.
5. Em cada tópico, informe termos curtos de busca para localizar questões relacionadas.
6. Seja específico e útil para um concurseiro, sem inventar disciplinas fora do edital.
7. Priorize os conteúdos com maior incidência ou relevância aparente no edital.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            edital_summary: { type: "string" },
            study_strategy: { type: "string" },
            disciplines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subject_key: { type: "string" },
                  subject_label: { type: "string" },
                  priority: { type: "string", enum: ["alta", "media", "baixa"] },
                  estimated_weight: { type: "number" },
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic_label: { type: "string" },
                        subtopics: { type: "array", items: { type: "string" } },
                        question_search_terms: { type: "array", items: { type: "string" } },
                        study_focus: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            weekly_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  goal: { type: "string" },
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_label: { type: "string" },
                        subject_label: { type: "string" },
                        topic_label: { type: "string" },
                        block_type: { type: "string", enum: ["teoria", "questoes", "revisao"] },
                        duration_minutes: { type: "number" },
                        objective: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ["edital_summary", "study_strategy", "disciplines", "weekly_plan"]
        }
      });

      setAnalysis(extracted);
      setLoadingRecommendations(true);
      const questionRecommendations = await buildRecommendations(extracted.disciplines || []);
      setRecommendations(questionRecommendations);
      toast.success("Edital analisado com sucesso.");
    } catch (error) {
      console.error("Erro ao analisar edital:", error);
      toast.error("Não foi possível analisar o edital agora.");
    } finally {
      setIsAnalyzing(false);
      setLoadingRecommendations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="w-4 h-4" />
            IA para leitura de edital
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900">Upload do edital com plano de estudo automático</h1>
          <p className="text-slate-600 md:text-lg">
            O sistema lê o PDF, extrai os conteúdos mais importantes, monta um cronograma verticalizado e recomenda questões do seu banco para cada tópico.
          </p>
        </div>

        <EditalIAUploadForm
          form={form}
          setForm={setForm}
          fileName={file?.name}
          isBusy={isAnalyzing || loadingRecommendations}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
        />

        {analysis && (
          <div className="space-y-8">
            <EditalIAOverview analysis={analysis} />
            <EditalIAPlan weeklyPlan={analysis.weekly_plan} />
            <EditalIARecommendations recommendations={recommendations} loading={loadingRecommendations} />
          </div>
        )}
      </div>
    </div>
  );
}