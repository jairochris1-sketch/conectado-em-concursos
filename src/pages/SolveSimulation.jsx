import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Trophy,
  PlayCircle,
  Pause
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SolveSimulation() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const simulationId = urlParams.get("id");

  const [simulation, setSimulation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    loadSimulation();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulationId]);

  useEffect(() => {
    if (simulation && simulation.status === "em_andamento" && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishSimulation();
            return 0;
          }
          
          // Avisos sonoros
          if (prev === 300) { // 5 minutos
            playWarningSound();
            toast.warning("⏰ 5 minutos restantes!");
          } else if (prev === 60) { // 1 minuto
            playWarningSound();
            toast.error("⏰ 1 minuto restante!");
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulation, isPaused, timeRemaining]);

  const playWarningSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Erro ao reproduzir som:", err));
    }
  };

  const loadSimulation = async () => {
    if (!simulationId) {
      toast.error("ID do simulado não encontrado");
      navigate(createPageUrl("SimuladosDigital"));
      return;
    }

    setLoading(true);
    try {
      const sim = await base44.entities.Simulation.filter({ id: simulationId });
      if (!sim || sim.length === 0) {
        toast.error("Simulado não encontrado");
        navigate(createPageUrl("SimuladosDigital"));
        return;
      }

      const simData = sim[0];
      setSimulation(simData);

      // Carregar questões
      const questionPromises = simData.question_ids.map(id =>
        base44.entities.Question.filter({ id })
      );
      const questionsData = await Promise.all(questionPromises);
      const loadedQuestions = questionsData.map(q => q[0]).filter(Boolean);
      setQuestions(loadedQuestions);

      // Configurar tempo
      if (simData.status === "nao_iniciado") {
        setTimeRemaining(simData.time_limit * 60);
      } else if (simData.status === "finalizado") {
        setIsFinished(true);
        setShowResults(true);
        if (simData.answers) {
          const answersMap = {};
          simData.answers.forEach(a => {
            answersMap[a.question_id] = a.user_answer;
          });
          setAnswers(answersMap);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar simulado:", error);
      toast.error("Erro ao carregar simulado");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    try {
      await base44.entities.Simulation.update(simulationId, {
        status: "em_andamento",
        started_at: new Date().toISOString()
      });
      
      setSimulation(prev => ({ ...prev, status: "em_andamento" }));
      setStartTime(new Date());
      toast.success("Simulado iniciado! Boa prova!");
    } catch (error) {
      console.error("Erro ao iniciar simulado:", error);
      toast.error("Erro ao iniciar simulado");
    }
  };

  const handleAnswer = (questionId, answer) => {
    if (isFinished) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFinishSimulation = async () => {
    if (isFinished) return;

    setIsFinished(true);
    
    try {
      // Calcular resultados
      const answersArray = questions.map(q => {
        const userAnswer = answers[q.id] || null;
        const isCorrect = userAnswer === q.correct_answer?.toLowerCase();
        
        return {
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          subject: q.subject,
          topic: q.topic
        };
      });

      const correctCount = answersArray.filter(a => a.is_correct).length;
      const score = (correctCount / questions.length) * 100;

      // Calcular desempenho por disciplina
      const performanceBySubject = {};
      answersArray.forEach(a => {
        if (!performanceBySubject[a.subject]) {
          performanceBySubject[a.subject] = { correct: 0, total: 0 };
        }
        performanceBySubject[a.subject].total++;
        if (a.is_correct) {
          performanceBySubject[a.subject].correct++;
        }
      });

      // Calcular desempenho por assunto
      const performanceByTopic = {};
      answersArray.forEach(a => {
        if (a.topic) {
          if (!performanceByTopic[a.topic]) {
            performanceByTopic[a.topic] = { correct: 0, total: 0 };
          }
          performanceByTopic[a.topic].total++;
          if (a.is_correct) {
            performanceByTopic[a.topic].correct++;
          }
        }
      });

      const totalTimeUsed = simulation.time_limit - Math.floor(timeRemaining / 60);

      await base44.entities.Simulation.update(simulationId, {
        status: "finalizado",
        score,
        answers: answersArray,
        performance_by_subject: performanceBySubject,
        performance_by_topic: performanceByTopic,
        total_time: totalTimeUsed,
        questions_answered: answersArray.filter(a => a.user_answer).length,
        finished_at: new Date().toISOString()
      });

      setSimulation(prev => ({
        ...prev,
        status: "finalizado",
        score,
        answers: answersArray,
        performance_by_subject: performanceBySubject,
        performance_by_topic: performanceByTopic
      }));

      setShowResults(true);
      toast.success("Simulado finalizado!");
    } catch (error) {
      console.error("Erro ao finalizar simulado:", error);
      toast.error("Erro ao finalizar simulado");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (simulation.time_limit * 60)) * 100;
    if (percentage > 50) return "text-green-600";
    if (percentage > 20) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando simulado...</div>
      </div>
    );
  }

  if (!simulation || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-6">
          <p className="text-gray-600 mb-4">Simulado não encontrado ou sem questões</p>
          <Button onClick={() => navigate(createPageUrl("SimuladosDigital"))}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  // Tela de Resultados
  if (showResults) {
    const correctCount = simulation.answers?.filter(a => a.is_correct).length || 0;
    const totalQuestions = questions.length;
    const score = simulation.score || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("SimuladosDigital"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Simulados
          </Button>

          {/* Resultado Geral */}
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Simulado Concluído!
              </h2>
              <p className="text-gray-600 mb-6">{simulation.name}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {score.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Aproveitamento</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {correctCount}/{totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Acertos</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {simulation.total_time || 0}min
                  </div>
                  <div className="text-sm text-gray-600">Tempo Total</div>
                </div>
              </div>

              {/* Desempenho por Disciplina */}
              {simulation.performance_by_subject && Object.keys(simulation.performance_by_subject).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Desempenho por Disciplina
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(simulation.performance_by_subject).map(([subject, perf]) => {
                      const percentage = ((perf.correct / perf.total) * 100).toFixed(1);
                      return (
                        <div key={subject} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">
                              {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm text-gray-600">
                              {perf.correct}/{perf.total}
                            </span>
                          </div>
                          <Progress value={parseFloat(percentage)} className="h-2" />
                          <div className="text-right text-sm text-gray-600 mt-1">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Desempenho por Assunto */}
              {simulation.performance_by_topic && Object.keys(simulation.performance_by_topic).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Desempenho por Assunto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {Object.entries(simulation.performance_by_topic)
                      .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
                      .map(([topic, perf]) => {
                        const percentage = ((perf.correct / perf.total) * 100).toFixed(1);
                        return (
                          <div key={topic} className="bg-white border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {topic}
                              </span>
                              <span className="text-xs text-gray-600">
                                {perf.correct}/{perf.total}
                              </span>
                            </div>
                            <Progress value={parseFloat(percentage)} className="h-1.5" />
                            <div className="text-right text-xs text-gray-600 mt-1">
                              {percentage}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gabarito Comentado */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Gabarito Comentado
          </h3>
          
          <div className="space-y-4">
            {questions.map((question, index) => {
              const answer = simulation.answers?.find(a => a.question_id === question.id);
              const userAnswer = answer?.user_answer;
              const isCorrect = answer?.is_correct;
              const correctAnswer = question.correct_answer?.toLowerCase();

              return (
                <Card key={question.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-semibold ${
                            isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isCorrect ? 'Correta' : 'Incorreta'}
                          </span>
                          
                          {question.subject && (
                            <Badge variant="outline" className="ml-2">
                              {question.subject.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>

                        <div 
                          className="text-gray-900 mb-4"
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
                                  isCorrectOption
                                    ? 'border-green-500 bg-green-50'
                                    : isUserAnswer
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCorrectOption
                                      ? 'bg-green-600 text-white'
                                      : isUserAnswer
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    {letter.toUpperCase()}
                                  </div>
                                  <div 
                                    className="flex-1 text-gray-800"
                                    dangerouslySetInnerHTML={{ __html: opt.text }}
                                  />
                                  {isCorrectOption && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {!isCorrect && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">
                              <strong>Sua resposta:</strong> {userAnswer?.toUpperCase() || 'Não respondida'}
                              <br />
                              <strong>Resposta correta:</strong> {correctAnswer?.toUpperCase()}
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">
                              📚 Explicação
                            </h4>
                            <div 
                              className="text-sm text-blue-800"
                              dangerouslySetInnerHTML={{ __html: question.explanation }}
                            />
                            {question.explanation_author && (
                              <p className="text-xs text-blue-600 mt-2">
                                Por: {question.explanation_author}
                                {question.explanation_author_subject && 
                                  ` - ${question.explanation_author_subject}`
                                }
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tela de início
  if (simulation.status === "nao_iniciado") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <PlayCircle className="w-20 h-20 mx-auto mb-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {simulation.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {simulation.question_count}
                </div>
                <div className="text-sm text-gray-600">Questões</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {simulation.time_limit}min
                </div>
                <div className="text-sm text-gray-600">Tempo Limite</div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {simulation.subjects?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Disciplinas</div>
              </div>
            </div>

            {simulation.subjects && simulation.subjects.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Disciplinas:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {simulation.subjects.map(subject => (
                    <Badge key={subject} variant="secondary">
                      {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleStartSimulation}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Iniciar Simulado
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("SimuladosDigital"))}
              className="w-full mt-4"
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>

        {/* Áudio para avisos */}
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKvj8bllHAU2jdXyy3grBSl+zPLaizsKElyx6OyrWBUIQ5zd8sFuJAUuhM/y2Ik2Bx1rwPDnn1EMDVG" />
      </div>
    );
  }

  // Tela de resolver questões
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo com cronômetro */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{simulation.name}</h2>
              <p className="text-sm text-gray-600">
                Questão {currentIndex + 1} de {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <PlayCircle className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              
              <div className={`flex items-center gap-2 ${getTimeColor()}`}>
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold font-mono">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-600">
              {answeredCount}/{questions.length} respondidas
            </span>
          </div>
        </div>
      </div>

      {/* Questão */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Card>
          <CardContent className="p-6">
            {currentQuestion.subject && (
              <Badge variant="outline" className="mb-4">
                {currentQuestion.subject.replace(/_/g, ' ')}
              </Badge>
            )}
            
            <div 
              className="text-gray-900 text-lg leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: currentQuestion.statement }}
            />

            <div className="space-y-3">
              {currentQuestion.options?.map((opt, i) => {
                const letter = (opt.letter || ['a', 'b', 'c', 'd', 'e'][i] || '').toLowerCase();
                const isSelected = answers[currentQuestion.id] === letter;

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQuestion.id, letter)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {letter.toUpperCase()}
                      </div>
                      <div 
                        className="flex-1 text-gray-800"
                        dangerouslySetInnerHTML={{ __html: opt.text }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={handleFinishSimulation}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Finalizar Simulado
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Áudio para avisos */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKvj8bllHAU2jdXyy3grBSl+zPLaizsKElyx6OyrWBUIQ5zd8sFuJAUuhM/y2Ik2Bx1rwPDnn1EMDVG" />
    </div>
  );
}