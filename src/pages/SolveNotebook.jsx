import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  BookOpen,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function SolveNotebook() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const notebookId = urlParams.get('id');

  const [notebook, setNotebook] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(new Date());

  useEffect(() => {
    loadNotebook();
  }, [notebookId]);

  const loadNotebook = async () => {
    try {
      const notebookData = await base44.entities.Notebook.get(notebookId);
      setNotebook(notebookData);

      const notebookQuestions = await base44.entities.NotebookQuestion.filter({ 
        notebook_id: notebookId 
      });

      const sortedQuestions = notebookQuestions.sort((a, b) => a.order - b.order);
      const questionIds = sortedQuestions.map(q => q.question_id);
      
      const questionsData = await Promise.all(
        questionIds.map(id => base44.entities.Question.get(id))
      );

      setQuestions(questionsData);

      // Verificar se há tentativa em andamento
      const attempts = await base44.entities.NotebookAttempt.filter({
        notebook_id: notebookId,
        status: 'in_progress'
      });

      if (attempts.length > 0) {
        const currentAttempt = attempts[0];
        setAttempt(currentAttempt);
        
        // Restaurar respostas
        const savedAnswers = {};
        currentAttempt.answers?.forEach(a => {
          savedAnswers[a.question_id] = a.user_answer;
        });
        setAnswers(savedAnswers);
      } else {
        // Criar nova tentativa
        const newAttempt = await base44.entities.NotebookAttempt.create({
          notebook_id: notebookId,
          status: 'in_progress',
          answers: []
        });
        setAttempt(newAttempt);
      }
    } catch (error) {
      console.error("Erro ao carregar caderno:", error);
      toast.error("Erro ao carregar caderno");
      navigate(createPageUrl("Notebooks"));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Salvar progresso
    try {
      const answersArray = Object.keys(newAnswers).map(qId => ({
        question_id: qId,
        user_answer: newAnswers[qId],
        is_correct: null
      }));

      await base44.entities.NotebookAttempt.update(attempt.id, {
        answers: answersArray
      });
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const handleFinish = async () => {
    try {
      // Calcular resultados
      const answersArray = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;
        
        return {
          question_id: q.id,
          user_answer: userAnswer || null,
          is_correct: isCorrect
        };
      });

      const correctCount = answersArray.filter(a => a.is_correct).length;
      const wrongCount = answersArray.filter(a => !a.is_correct && a.user_answer).length;
      const score = (correctCount / questions.length) * 100;

      await base44.entities.NotebookAttempt.update(attempt.id, {
        status: 'completed',
        answers: answersArray,
        correct_count: correctCount,
        wrong_count: wrongCount,
        score: score,
        completed_at: new Date().toISOString()
      });

      // Salvar respostas individuais
      await Promise.all(
        answersArray.map(a => 
          base44.entities.UserAnswer.create({
            question_id: a.question_id,
            user_answer: a.user_answer || 'N/A',
            is_correct: a.is_correct,
            subject: questions.find(q => q.id === a.question_id)?.subject || '',
            institution: questions.find(q => q.id === a.question_id)?.institution || ''
          })
        )
      );

      setShowResult(true);
      toast.success("Caderno finalizado!");
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao finalizar caderno");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showResult) {
    const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const score = (correctCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Resultado - {notebook.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {score.toFixed(1)}%
                </div>
                <p className="text-gray-600">Aproveitamento</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Acertos</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {questions.length - correctCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Erros</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Gabarito Detalhado</h3>
                {questions.map((q, index) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct_answer;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700'
                          : 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">Questão {index + 1}</span>
                            {isCorrect ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm mb-2" dangerouslySetInnerHTML={{ 
                            __html: q.statement?.substring(0, 150) + '...' 
                          }} />
                          <div className="flex gap-4 text-sm">
                            <span>
                              Sua resposta: <strong>{userAnswer || 'Não respondida'}</strong>
                            </span>
                            <span>
                              Gabarito: <strong className="text-green-600">{q.correct_answer}</strong>
                            </span>
                          </div>
                          {q.explanation && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                                Ver explicação
                              </summary>
                              <div 
                                className="mt-2 p-3 bg-white dark:bg-gray-800 rounded text-sm"
                                dangerouslySetInnerHTML={{ __html: q.explanation }}
                              />
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => navigate(createPageUrl("Notebooks"))}
                  variant="outline"
                >
                  Voltar aos Cadernos
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Resolver Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm("Deseja sair? Seu progresso será salvo.")) {
                navigate(createPageUrl("Notebooks"));
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {notebook.name}
              </h2>
              <Badge variant="outline">
                {answeredCount}/{questions.length} respondidas
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Questão {currentQuestionIndex + 1} de {questions.length}
              </CardTitle>
              <div className="flex gap-2">
                <Badge>{currentQuestion.subject}</Badge>
                <Badge variant="outline">{currentQuestion.institution}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.associated_text && (
              <div 
                className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg"
                dangerouslySetInnerHTML={{ __html: currentQuestion.associated_text }}
              />
            )}

            <div 
              className="text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.statement }}
            />

            {currentQuestion.command && (
              <div 
                className="font-medium"
                dangerouslySetInnerHTML={{ __html: currentQuestion.command }}
              />
            )}

            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.letter}
                  onClick={() => handleAnswer(currentQuestion.id, option.letter)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion.id] === option.letter
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-lg min-w-[30px]">
                      {option.letter})
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: option.text }} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={answeredCount < questions.length}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Próxima
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    currentQuestionIndex === index
                      ? 'bg-blue-600 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-700 dark:bg-green-900'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}