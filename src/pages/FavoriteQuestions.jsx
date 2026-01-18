import React, { useState, useEffect, useCallback } from "react";
import { Question, User, Favorite } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import QuestionList from "../components/questions/QuestionList";
import Pagination from "../components/questions/Pagination";

export default function FavoriteQuestions() {
  const [favoriteQuestions, setFavoriteQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [responseHistory, setResponseHistory] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('questions-layout') || 'classic';
  });

  const questionsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        const favorites = await Favorite.filter({ created_by: user.email });
        const questionIds = favorites.map(fav => fav.question_id);

        if (questionIds.length > 0) {
          const allQuestions = await Question.list("-created_date", 500);
          const favorited = allQuestions.filter(q => questionIds.includes(q.id));
          setFavoriteQuestions(favorited);
        }
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteFavorite = async (questionId) => {
    if (!currentUser) return;

    try {
      const favorite = await Favorite.filter({ question_id: questionId, created_by: currentUser.email });
      if (favorite.length > 0) {
        await Favorite.delete(favorite[0].id);
        setFavoriteQuestions(prev => prev.filter(q => q.id !== questionId));
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAnswer = async (question) => {
    const userAnswer = userAnswers[question.id];
    if (!userAnswer) return;

    const isCorrect = userAnswer === question.correct_answer;

    try {
      setSubmittedAnswers(prev => ({
        ...prev,
        [question.id]: { userAnswer, isCorrect, submitted: true }
      }));
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const totalPages = Math.ceil(favoriteQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = favoriteQuestions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-6 md:mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Questões Favoritas
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {favoriteQuestions.length} questão(ões) salva(s) para revisão
            </p>
          </div>
        </motion.div>

        <div className="space-y-4 md:space-y-6">
          {favoriteQuestions.length > 0 ? (
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
                fontSize={1}
                isBlocked={false}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={favoriteQuestions.length}
                  itemsPerPage={questionsPerPage}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg mx-3">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma questão favorita
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clique na estrela em uma questão para adicioná-la aos favoritos.
              </p>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Remover dos favoritos?
            </h3>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteFavorite(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}