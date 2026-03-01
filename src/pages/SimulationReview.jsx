import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Trophy, Clock, CheckCircle2, AlertCircle, Search,
  RotateCcw, BookOpen, ChevronDown, ChevronUp, Filter, Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ScoreBadge({ score }) {
  const color = score >= 70 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${color}`}>{score.toFixed(1)}%</span>;
}

function QuestionReview({ question, answer, index }) {
  const [expanded, setExpanded] = useState(false);
  const userAnswer = answer?.user_answer;
  const isCorrect = answer?.is_correct;
  const correctAnswer = question.correct_answer?.toLowerCase();

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${isCorrect ? "border-green-200" : "border-red-200"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-left ${isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isCorrect ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {index + 1}
          </div>
          {isCorrect
            ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {question.statement?.replace(/<[^>]*>/g, '').slice(0, 100)}...
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {question.subject && (
            <Badge variant="outline" className="hidden sm:flex text-xs">{question.subject.replace(/_/g, ' ')}</Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
          {question.subject && (
            <Badge variant="outline" className="mb-3">{question.subject.replace(/_/g, ' ')}</Badge>
          )}
          <div
            className="text-gray-900 dark:text-gray-100 mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.statement }}
          />

          <div className="space-y-2 mb-4">
            {question.options?.map((opt, i) => {
              const letter = (opt.letter || ['a', 'b', 'c', 'd', 'e'][i] || '').toLowerCase();
              const isUserAnswer = userAnswer === letter;
              const isCorrectOption = correctAnswer === letter;
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    isCorrectOption ? "border-green-500 bg-green-50 dark:bg-green-900/20" :
                    isUserAnswer ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                    "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCorrectOption ? "bg-green-600 text-white" :
                      isUserAnswer ? "bg-red-600 text-white" :
                      "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {letter.toUpperCase()}
                    </div>
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: opt.text }} />
                    {isCorrectOption && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          {!isCorrect && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-sm">
              <span className="text-red-800 dark:text-red-300">
                <strong>Sua resposta:</strong> {userAnswer?.toUpperCase() || 'Não respondida'} &nbsp;|&nbsp;
                <strong>Correta:</strong> {correctAnswer?.toUpperCase()}
              </span>
            </div>
          )}

          {question.explanation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Explicação
              </h5>
              <div className="text-sm text-blue-800 dark:text-blue-200" dangerouslySetInnerHTML={{ __html: question.explanation }} />
              {question.explanation_author && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Por: {question.explanation_author}{question.explanation_author_subject ? ` — ${question.explanation_author_subject}` : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SimulationCard({ simulation, onReview, onRedo }) {
  const score = simulation.score || 0;
  const correctCount = simulation.answers?.filter(a => a.is_correct).length || 0;
  const totalQuestions = simulation.question_count || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{simulation.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {simulation.finished_at
                ? format(new Date(simulation.finished_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : format(new Date(simulation.created_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <ScoreBadge score={score} />
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{correctCount}/{totalQuestions} acertos</span>
            <span>{score.toFixed(1)}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> {simulation.total_time || 0}min
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            📝 {totalQuestions} questões
          </span>
          {simulation.subjects?.slice(0, 2).map(s => (
            <span key={s} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {s.replace(/_/g, ' ')}
            </span>
          ))}
          {(simulation.subjects?.length || 0) > 2 && (
            <span className="text-xs text-gray-500">+{simulation.subjects.length - 2}</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onReview(simulation)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <Eye className="w-4 h-4 mr-1" /> Revisar
          </Button>
          <Button onClick={() => onRedo(simulation)} variant="outline" size="sm" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-1" /> Refazer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimulationReview() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | good | bad
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionFilter, setQuestionFilter] = useState("all"); // all | correct | wrong

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Simulation.filter({ created_by: user.email, status: "finalizado" });
      setSimulations(data.sort((a, b) => new Date(b.finished_at || b.created_date) - new Date(a.finished_at || a.created_date)));
    } catch (error) {
      toast.error("Erro ao carregar simulados");
    } finally {
      setLoading(false);
    }
  };

  const openReview = async (simulation) => {
    setSelected(simulation);
    setLoadingQuestions(true);
    setQuestionFilter("all");
    try {
      const ids = simulation.question_ids || [];
      const results = await Promise.all(ids.map(id => base44.entities.Question.filter({ id })));
      setQuestions(results.map(r => r[0]).filter(Boolean));
    } catch {
      toast.error("Erro ao carregar questões");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleRedo = async (simulation) => {
    if (!confirm("Isso criará um novo simulado com as mesmas questões. Deseja continuar?")) return;
    try {
      const newSim = await base44.entities.Simulation.create({
        name: `${simulation.name} (Refeito)`,
        subjects: simulation.subjects,
        institutions: simulation.institutions,
        question_count: simulation.question_count,
        question_ids: simulation.question_ids,
        time_limit: simulation.time_limit,
        status: "nao_iniciado",
        edital_id: simulation.edital_id || undefined
      });
      toast.success("Novo simulado criado!");
      navigate(createPageUrl("SolveSimulation") + "?id=" + newSim.id);
    } catch {
      toast.error("Erro ao criar novo simulado");
    }
  };

  const filtered = simulations.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "good" ? (s.score || 0) >= 70 :
      (s.score || 0) < 70;
    return matchSearch && matchFilter;
  });

  const displayedQuestions = questions.filter(q => {
    const answer = selected?.answers?.find(a => a.question_id === q.id);
    if (questionFilter === "correct") return answer?.is_correct;
    if (questionFilter === "wrong") return !answer?.is_correct;
    return true;
  });

  // Detail view
  if (selected) {
    const score = selected.score || 0;
    const correctCount = selected.answers?.filter(a => a.is_correct).length || 0;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setSelected(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à lista
          </Button>

          {/* Summary Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                  {selected.finished_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Concluído em {format(new Date(selected.finished_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <Button onClick={() => handleRedo(selected)} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" /> Refazer
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">{score.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Aproveitamento</p>
                </div>
                <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{correctCount}/{selected.question_count}</p>
                  <p className="text-xs text-gray-500">Acertos</p>
                </div>
                <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600">{selected.total_time || 0}min</p>
                  <p className="text-xs text-gray-500">Tempo</p>
                </div>
              </div>

              {/* Performance by subject */}
              {selected.performance_by_subject && Object.keys(selected.performance_by_subject).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Desempenho por disciplina</p>
                  <div className="space-y-2">
                    {Object.entries(selected.performance_by_subject).map(([subject, perf]) => {
                      const pct = ((perf.correct / perf.total) * 100).toFixed(0);
                      return (
                        <div key={subject}>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                            <span>{subject.replace(/_/g, ' ')}</span>
                            <span>{perf.correct}/{perf.total} ({pct}%)</span>
                          </div>
                          <Progress value={parseFloat(pct)} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Gabarito Comentado ({displayedQuestions.length} questões)
            </h3>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Todas" },
                { value: "correct", label: "✓ Acertos" },
                { value: "wrong", label: "✗ Erros" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setQuestionFilter(opt.value)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                    questionFilter === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loadingQuestions ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {displayedQuestions.map((q, i) => {
                const globalIndex = questions.indexOf(q);
                const answer = selected.answers?.find(a => a.question_id === q.id);
                return <QuestionReview key={q.id} question={q} answer={answer} index={globalIndex} />;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revisão de Simulados</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{simulations.length} simulado(s) concluído(s)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar simulado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "good", label: "≥ 70%" },
              { value: "bad", label: "< 70%" }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`text-sm px-4 py-2 rounded-lg border font-medium transition-all ${
                  filter === opt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-14 h-14 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {simulations.length === 0
                ? "Nenhum simulado concluído ainda. Complete um simulado para revisá-lo aqui!"
                : "Nenhum simulado encontrado com este filtro."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(sim => (
              <SimulationCard key={sim.id} simulation={sim} onReview={openReview} onRedo={handleRedo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}