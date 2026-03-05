import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  Flame,
  Target,
  Brain,
  Lightbulb,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LogicCourse() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState([]);
  const [view, setView] = useState("lessons");
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadLessons();
    loadProgress();
  }, []);

  const loadLessons = async () => {
    try {
      const data = await base44.entities.LogicLesson.filter({ is_active: true }, "day");
      setLessons(data);
    } catch (error) {
      console.error("Erro ao carregar lições:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await base44.entities.LogicProgress.list("-created_date");
      setProgress(data);
      
      const today = new Date();
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      const completedDays = [...new Set(data.map(p => {
        const date = new Date(p.created_date);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }))];
      
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (completedDays.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    }
  };

  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setCurrentExercise(0);
    setScore(0);
    setView("lesson");
    setStartTime(Date.now());
  };

  const startExercises = () => {
    setView("exercise");
    setCurrentExercise(0);
    setUserAnswer("");
    setShowResult(false);
  };

  const checkAnswer = () => {
    const exercise = currentLesson.exercises[currentExercise];
    const correct = userAnswer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 1);
      toast.success("Correto! 🎉");
    } else {
      toast.error("Incorreto. Veja a explicação.");
    }
  };

  const nextExercise = async () => {
    setShowResult(false);
    setUserAnswer("");
    
    if (currentExercise < currentLesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const totalQuestions = currentLesson.exercises.length;
      const percentage = Math.round((score / totalQuestions) * 100);
      
      try {
        await base44.entities.LogicProgress.create({
          lesson_id: currentLesson.id,
          day: currentLesson.day,
          score: percentage,
          total_questions: totalQuestions,
          correct_answers: score,
          time_spent: timeSpent,
          completed: percentage >= 70
        });
        
        toast.success(`Lição concluída! ${percentage}% de acertos`, {
          description: `Você acertou ${score} de ${totalQuestions} exercícios`
        });
        
        loadProgress();
        setView("lessons");
        setCurrentLesson(null);
      } catch (error) {
        console.error("Erro ao salvar progresso:", error);
        toast.error("Erro ao salvar progresso");
      }
    }
  };

  const getLessonProgress = (lessonId) => {
    const lessonProgress = progress.filter(p => p.lesson_id === lessonId);
    if (lessonProgress.length === 0) return null;
    
    const best = lessonProgress.reduce((max, p) => p.score > max.score ? p : max, lessonProgress[0]);
    return best;
  };

  if (view === "lesson" && currentLesson) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Aula {currentLesson.day}: {currentLesson.title}
              </h2>
              <Badge className="mt-2">{currentLesson.module}</Badge>
            </div>
            <Button variant="outline" onClick={() => setView("lessons")}>
              Voltar
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Lightbulb className="w-5 h-5" />
                Explicação
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: currentLesson.explanation.replace(/\n/g, '<br />') }} />
            </CardContent>
          </Card>

          {currentLesson.examples && currentLesson.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                  <BookOpen className="w-5 h-5" />
                  Exemplos Resolvidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLesson.examples.map((example, index) => (
                  <div key={index} className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <h4 className="font-semibold text-teal-900 dark:text-teal-300 mb-2">
                      {example.title}
                    </h4>
                    <p className="text-gray-900 dark:text-white font-medium mb-2">
                      📝 {example.problem}
                    </p>
                    <div className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                      <div dangerouslySetInnerHTML={{ __html: example.solution.replace(/\n/g, '<br />') }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startExercises}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            >
              Começar Exercícios
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "exercise" && currentLesson) {
    const exercise = currentLesson.exercises[currentExercise];
    const progressPercent = ((currentExercise + 1) / currentLesson.exercises.length) * 100;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Exercício {currentExercise + 1} de {currentLesson.exercises.length}
            </span>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              Pontuação: {score}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {exercise.question}
                </h3>

                {exercise.type === "multiple_choice" && (
                  <div className="space-y-3">
                    {exercise.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        disabled={showResult}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          userAnswer === option
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                        } ${
                          showResult && option === exercise.correct_answer
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : ""
                        } ${
                          showResult && userAnswer === option && !isCorrect
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : ""
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {exercise.type === "input_answer" && (
                  <Input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Digite sua resposta..."
                    className="text-lg p-4"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !showResult && userAnswer.trim()) {
                        checkAnswer();
                      }
                    }}
                  />
                )}

                {exercise.type === "true_false" && (
                  <div className="space-y-3">
                    {["Verdadeiro", "Falso"].map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        disabled={showResult}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          userAnswer === option
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                        } ${
                          showResult && option === exercise.correct_answer
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : ""
                        } ${
                          showResult && userAnswer === option && !isCorrect
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : ""
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`mb-6 ${isCorrect ? "border-green-500" : "border-red-500"} border-2`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <div>
                            <h4 className="text-lg font-bold text-green-700 dark:text-green-400">
                              Correto! 🎉
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Excelente raciocínio!
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-red-500" />
                          <div>
                            <h4 className="text-lg font-bold text-red-700 dark:text-red-400">
                              Incorreto
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              Resposta correta: <strong>{exercise.correct_answer}</strong>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {exercise.explanation && (
                      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          💡 {exercise.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="flex justify-center">
              {!showResult ? (
                <Button
                  size="lg"
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim()}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  Verificar Resposta
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={nextExercise}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {currentExercise < currentLesson.exercises.length - 1 ? "Próximo" : "Finalizar"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative">
          <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 right-4 text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3 mt-4 md:mt-0">
            🧠 Raciocínio Lógico para Concursos
          </h1>
          <p className="text-teal-100 text-lg">
            Desenvolva seu raciocínio lógico de forma prática e objetiva!
          </p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-100">Sequência de Estudos</p>
                  <p className="text-3xl font-bold">
                    {streak} {streak === 1 ? "dia" : "dias"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">Lições Completas</p>
                  <p className="text-3xl font-bold">
                    {progress.filter(p => p.completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-100">Média de Acertos</p>
                  <p className="text-3xl font-bold">
                    {progress.length > 0
                      ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => {
          const lessonProgress = getLessonProgress(lesson.id);
          const isCompleted = lessonProgress?.completed;
          
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="cursor-pointer hover:shadow-2xl transition-all h-full flex flex-col border-2 border-transparent hover:border-teal-400 overflow-hidden">
                <div className={`h-2 ${isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-teal-400 to-cyan-500'}`} />
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200">
                      Aula {lesson.day}
                    </Badge>
                    {isCompleted && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Concluído</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{lesson.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {lesson.topic}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <Brain className="w-4 h-4 text-teal-500" />
                      <span className="font-medium">{lesson.exercises?.length || 0} exercícios</span>
                    </div>
                    
                    {lessonProgress && (
                      <div className="pt-2 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Melhor pontuação
                          </span>
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                            {lessonProgress.score}%
                          </span>
                        </div>
                        <Progress value={lessonProgress.score} className="h-2" />
                      </div>
                    )}

                    <Button
                      onClick={() => startLesson(lesson)}
                      className={`w-full mt-2 font-semibold ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'}`}
                      size="lg"
                    >
                      {isCompleted ? "🔄 Revisar" : "🚀 Começar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <Card className="p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma lição disponível ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            As lições serão adicionadas em breve!
          </p>
        </Card>
      )}
    </div>
  );
}