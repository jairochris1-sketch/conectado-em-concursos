import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  Award,
  Flame,
  Target,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function EnglishCourse() {
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState([]);
  const [view, setView] = useState("lessons"); // lessons, lesson, exercise
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [exercisesToday, setExercisesToday] = useState(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadLessons();
    loadProgress();
    loadDailyProgress();
    
    // Inicializar reconhecimento de voz
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
  }, []);

  const loadLessons = async () => {
    try {
      const data = await base44.entities.EnglishLesson.filter({ is_active: true }, "day");
      setLessons(data);
    } catch (error) {
      console.error("Erro ao carregar lições:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await base44.entities.EnglishProgress.list("-created_date");
      setProgress(data);
      
      // Calcular streak
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

  const loadDailyProgress = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const data = await base44.entities.EnglishProgress.list("-created_date");
      const todayProgress = data.filter(p => {
        const date = new Date(p.created_date);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });
      
      const totalExercises = todayProgress.reduce((sum, p) => sum + (p.total_questions || 0), 0);
      setExercisesToday(totalExercises);
    } catch (error) {
      console.error("Erro ao carregar progresso diário:", error);
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

  const playSound = (isCorrectAnswer) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (isCorrectAnswer) {
        // Som de acerto: notas ascendentes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      } else {
        // Som de erro: nota descendente
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Erro ao reproduzir som:", error);
    }
  };

  const checkAnswer = () => {
    const exercise = currentLesson.exercises[currentExercise];
    const correct = userAnswer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    playSound(correct);
    
    if (correct) {
      setScore(score + 1);
    }
  };

  const startPronunciationCheck = (targetPhrase) => {
    if (!recognitionRef.current) {
      toast.error("Reconhecimento de voz não disponível neste navegador");
      return;
    }

    setIsListening(true);
    
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setUserAnswer(transcript);
      setIsListening(false);
      
      // Comparar com a frase esperada
      const similarity = calculateSimilarity(transcript, targetPhrase.toLowerCase());
      setIsCorrect(similarity > 0.7);
      setShowResult(true);
      playSound(similarity > 0.7);
      
      if (similarity > 0.7) {
        setScore(score + 1);
      }
    };
    
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast.error("Erro ao reconhecer a fala. Tente novamente.");
    };
    
    recognitionRef.current.start();
  };

  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const matches = words1.filter(word => words2.includes(word)).length;
    return matches / Math.max(words1.length, words2.length);
  };

  const nextExercise = async () => {
    setShowResult(false);
    setUserAnswer("");
    
    if (currentExercise < currentLesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      // Concluir lição
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const totalQuestions = currentLesson.exercises.length;
      const percentage = Math.round((score / totalQuestions) * 100);
      
      try {
        await base44.entities.EnglishProgress.create({
          lesson_id: currentLesson.id,
          day: currentLesson.day,
          score: percentage,
          total_questions: totalQuestions,
          correct_answers: score,
          time_spent: timeSpent,
          completed: percentage >= 70
        });
        
        toast.success(`Lição concluída! ${percentage}% de acertos`, {
          description: `Você acertou ${score} de ${totalQuestions} questões`
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
                Dia {currentLesson.day}: {currentLesson.title}
              </h2>
              <Badge className="mt-2">{currentLesson.level}</Badge>
            </div>
            <Button variant="outline" onClick={() => setView("lessons")}>
              Voltar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Vocabulário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLesson.words?.map((word, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {word.english}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(word.english);
                            utterance.lang = 'en-US';
                            speechSynthesis.speak(utterance);
                          }}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {word.portuguese}
                      </p>
                      {word.pronunciation && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Pronúncia: {word.pronunciation}
                        </p>
                      )}
                      {word.example && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{word.example}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {currentLesson.conversations && currentLesson.conversations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Conversação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLesson.conversations.map((conv, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-900 dark:text-blue-300 font-medium mb-2">
                      {conv.english}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {conv.portuguese}
                    </p>
                    {conv.context && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        💡 {conv.context}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startExercises}
              className="bg-green-600 hover:bg-green-700 text-white"
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
              Questão {currentExercise + 1} de {currentLesson.exercises.length}
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
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

                {exercise.type === "choose" && (
                  <div className="space-y-3">
                    {exercise.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        disabled={showResult}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          userAnswer === option
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
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

                {exercise.type === "translate" && (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Digite sua resposta..."
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !showResult && userAnswer.trim()) {
                        checkAnswer();
                      }
                    }}
                  />
                )}

                {exercise.type === "fill_blank" && (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                      {exercise.sentence?.split('___').map((part, idx, arr) => (
                        <span key={idx}>
                          {part}
                          {idx < arr.length - 1 && (
                            <input
                              type="text"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              disabled={showResult}
                              className="inline-block w-32 mx-2 px-3 py-1 border-b-2 border-blue-500 bg-transparent text-center focus:outline-none focus:border-blue-600"
                              placeholder="..."
                            />
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {exercise.type === "grammar" && (
                  <div className="space-y-3">
                    {exercise.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        disabled={showResult}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          userAnswer === option
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
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

                {exercise.type === "pronunciation" && (
                  <div className="space-y-4">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <p className="text-center text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        "{exercise.sentence}"
                      </p>
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Clique no botão e repita a frase em voz alta
                      </p>
                    </div>
                    
                    {!showResult ? (
                      <Button
                        onClick={() => startPronunciationCheck(exercise.sentence)}
                        disabled={isListening}
                        className="w-full"
                        size="lg"
                      >
                        <Volume2 className={`w-5 h-5 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
                        {isListening ? "Ouvindo..." : "Começar Gravação"}
                      </Button>
                    ) : userAnswer && (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Você disse:</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">"{userAnswer}"</p>
                      </div>
                    )}
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
                              Excelente trabalho!
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
                exercise.type === "pronunciation" ? null : (
                  <Button
                    size="lg"
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Verificar Resposta
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  onClick={nextExercise}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {currentExercise < currentLesson.exercises.length - 1 ? "Próxima" : "Finalizar"}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mini Curso de Inglês 🇬🇧
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Aprenda inglês de forma divertida e interativa todos os dias!
        </p>
        
        <Card className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-white">Meta Diária</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {exercisesToday} / {dailyGoal} exercícios
              </span>
            </div>
            <Progress value={(exercisesToday / dailyGoal) * 100} className="h-2" />
            {exercisesToday >= dailyGoal && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Meta diária concluída! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sequência</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streak} {streak === 1 ? "dia" : "dias"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lições Completas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress.filter(p => p.completed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Média de Acertos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress.length > 0
                    ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              whileHover={{ y: -5 }}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Dia {lesson.day}</Badge>
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{lesson.words?.length || 0} palavras</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Award className="w-4 h-4" />
                      <span>{lesson.exercises?.length || 0} exercícios</span>
                    </div>
                    
                    {lessonProgress && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Melhor pontuação
                          </span>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {lessonProgress.score}%
                          </span>
                        </div>
                        <Progress value={lessonProgress.score} className="h-1" />
                      </div>
                    )}

                    <Button
                      onClick={() => startLesson(lesson)}
                      className="w-full mt-2"
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted ? "Revisar" : "Começar"}
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
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
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