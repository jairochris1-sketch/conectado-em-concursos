import React, { useState, useEffect, useCallback } from "react";
import { Question, UserAnswer, User, ResponseHistory } from "@/entities/all";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Award,
  AlertTriangle,
  FileText,
  Plus,
  Minus,
  Clock } from
"lucide-react";
import { motion } from "framer-motion";

import QuestionFilters from "../components/questions/QuestionFilters";
import QuestionList from "../components/questions/QuestionList";
import Pagination from "../components/questions/Pagination";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { useQuestionLimit } from "@/components/hooks/useQuestionLimit";
import DailyLimitBanner from "@/components/limits/DailyLimitBanner";
import StudyTimer from "../components/questions/StudyTimer";
import ExamCalendar from "../components/questions/ExamCalendar";

const shuffleArray = (array) => {
  let currentIndex = array.length,randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
    array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function Questions() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [responseHistory, setResponseHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ submitted: 0, correct: 0, accuracy: 0 });
  // const [viewMode, setViewMode] = useState("questions"); // Removed as Tabs component is removed
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('questions-layout') || 'classic';
  });
  const [fontSize, setFontSize] = useState(1);

  const { isBlocked, questionsAnsweredToday, dailyLimit, incrementCount, remainingQuestions } = useQuestionLimit();

  const questionsPerPage = 20;

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    try {
      const questionsData = await Question.list("-created_date", 100000);
      const shuffledQuestions = shuffleArray([...questionsData]);
      setAllQuestions(shuffledQuestions);

      // Aplicar filtros iniciais com base nas preferências do usuário
      let initialFiltered = shuffledQuestions;
      if (currentUser) {
        if (currentUser.preferred_subjects && currentUser.preferred_subjects.length > 0) {
          initialFiltered = initialFiltered.filter((q) => currentUser.preferred_subjects.includes(q.subject));
        }
        if (currentUser.target_position) {
          initialFiltered = initialFiltered.filter((q) => q.cargo === currentUser.target_position);
        }
      }
      setFilteredQuestions(initialFiltered);

      setCurrentPage(1);

      const historyData = await ResponseHistory.filter({ created_by: currentUser.email }, "-created_date", 200);
      const historyByQuestion = {};

      historyData.forEach((response) => {
        if (!historyByQuestion[response.question_id] ||
        new Date(response.created_date) > new Date(historyByQuestion[response.question_id].created_date)) {
          historyByQuestion[response.question_id] = response;
        }
      });

      setResponseHistory(historyByQuestion);
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
    }
    setIsLoading(false);
  }, [currentUser]);

  const getStats = useCallback(async () => {
    if (!currentUser) return { submitted: 0, correct: 0, accuracy: 0 };

    try {
      const userAnswersData = await UserAnswer.filter({ created_by: currentUser.email }, "-created_date", 500);
      const submitted = userAnswersData.length;
      const correct = userAnswersData.filter((a) => a.is_correct).length;
      const accuracy = submitted > 0 ? Math.round(correct / submitted * 100) : 0;

      return { submitted, correct, accuracy };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return { submitted: 0, correct: 0, accuracy: 0 };
    }
  }, [currentUser]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadQuestions();
    }
  }, [loadQuestions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const updateStats = async () => {
        const newStats = await getStats();
        setStats(newStats);
      };
      updateStats();
    }
  }, [currentUser, getStats, submittedAnswers]);

  const handleFilterSubmit = useCallback((filters) => {
    console.log("Filtros aplicados:", filters);
    setIsLoading(true);

    try {
      let tempFiltered = [...allQuestions];

      // Busca por texto no enunciado, comando e texto associado
      if (filters.keyword) {
        const lowercasedKeyword = filters.keyword.toLowerCase();
        tempFiltered = tempFiltered.filter((q) =>
        q.statement?.toLowerCase().includes(lowercasedKeyword) ||
        q.command?.toLowerCase().includes(lowercasedKeyword) ||
        q.associated_text?.toLowerCase().includes(lowercasedKeyword)
        );
      }

      // Múltiplos filtros simultâneos
      if (filters.subjects && filters.subjects.length > 0) {
        tempFiltered = tempFiltered.filter((q) => filters.subjects.includes(q.subject));
      }
      if (filters.topics && filters.topics.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.topic && filters.topics.includes(q.topic));
      }
      if (filters.institutions && filters.institutions.length > 0) {
        tempFiltered = tempFiltered.filter((q) => filters.institutions.includes(q.institution));
      }
      if (filters.carreiras && filters.carreiras.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.carreira && filters.carreiras.includes(q.carreira));
      }
      if (filters.cargos && filters.cargos.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.cargo && filters.cargos.includes(q.cargo));
      }
      if (filters.years && filters.years.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.year && filters.years.includes(q.year.toString()));
      }
      if (filters.educationLevels && filters.educationLevels.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.education_level && filters.educationLevels.includes(q.education_level));
      }
      if (filters.difficulties && filters.difficulties.length > 0) {
        tempFiltered = tempFiltered.filter((q) => q.difficulty && filters.difficulties.includes(q.difficulty));
      }

      console.log("Questões filtradas:", tempFiltered.length);
      setFilteredQuestions(shuffleArray(tempFiltered));
      setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao filtrar questões:", error);
    }

    setIsLoading(false);
  }, [allQuestions]);

  const handleLayoutToggle = () => {
    const newLayout = layoutMode === 'compact' ? 'classic' : 'compact';
    setLayoutMode(newLayout);
    localStorage.setItem('questions-layout', newLayout);
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 0.1, 1.5));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 0.1, 0.8));
  };

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswer = async (question) => {
    const userAnswer = userAnswers[question.id];
    if (!userAnswer) return;

    if (isBlocked) {
      return;
    }

    const isCorrect = userAnswer === question.correct_answer;

    const previousAttempts = await ResponseHistory.filter({
      question_id: question.id,
      created_by: currentUser.email
    });
    const attemptNumber = previousAttempts.length + 1;

    const historyData = {
      question_id: question.id,
      user_answer: userAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      subject: question.subject,
      institution: question.institution,
      attempt_number: attemptNumber
    };

    try {
      const savedHistory = await ResponseHistory.create(historyData);

      setResponseHistory((prev) => ({
        ...prev,
        [question.id]: savedHistory
      }));

      const answerData = {
        question_id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        subject: question.subject,
        institution: question.institution
      };

      await UserAnswer.create(answerData);
      setSubmittedAnswers((prev) => ({
        ...prev,
        [question.id]: {
          userAnswer,
          isCorrect,
          submitted: true
        }
      }));

      incrementCount();
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  if (isLoading && (allQuestions.length === 0 || currentUser === null)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando questões...</p>
        </div>
      </div>);

  }

  return (
    <div className="bg-gray-50 p-3 min-h-screen dark:bg-gray-900 md:p-8">
      <Toaster richColors position="top-center" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-6 md:mb-8">

          <div>
            <h1 className="text-slate-900 mb-2 text-2xl font-bold md:text-3xl dark:text-white">
              Questões de Concursos Públicos
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-gray-900 dark:text-gray-300">
                {allQuestions.length} questões disponíveis
              </span>
              <span className="bg-transparent text-gray-900 dark:text-gray-300 flex items-center gap-1">
                <Award className="w-4 h-4" />
                {stats.accuracy}% de acerto ({stats.correct}/{stats.submitted})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFontSize}
                className="rounded-r-none">

                <Minus className="w-4 h-4 mr-1" /> A
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={increaseFontSize}
                className="rounded-l-none border-l-0">

                A <Plus className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <StudyTimer />
            <ExamCalendar />
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="w-full">
          <QuestionFilters onFilterSubmit={handleFilterSubmit} />

          <div className="space-y-4 md:space-y-6">
            <DailyLimitBanner
              questionsAnsweredToday={questionsAnsweredToday}
              dailyLimit={dailyLimit}
              remainingQuestions={remainingQuestions} />

            {isLoading && allQuestions.length > 0 ?
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Filtrando questões...</p>
               </div> :
            currentQuestions.length > 0 ?
            <>
                <QuestionList
                questions={currentQuestions}
                userAnswers={userAnswers}
                submittedAnswers={submittedAnswers}
                responseHistory={responseHistory}
                onAnswerChange={handleAnswerChange}
                onSubmitAnswer={handleSubmitAnswer}
                currentPage={currentPage}
                questionsPerPage={questionsPerPage}
                layoutMode={layoutMode}
                fontSize={fontSize}
                isBlocked={isBlocked} />

                {totalPages > 1 &&
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredQuestions.length}
                itemsPerPage={questionsPerPage} />

              }
              </> :

            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg mx-3">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma questão encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 px-4">
                  Tente ajustar os filtros para encontrar o que procura.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}