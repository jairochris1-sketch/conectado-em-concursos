import React, { useState, useEffect } from 'react';
import { FlashcardReview } from '@/entities/FlashcardReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Eye, EyeOff, Timer, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Algoritmo SM-2 para repetição espaçada
const calculateNextReview = (quality, easinessFactor, interval, repetitions) => {
  let newEasinessFactor = easinessFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 2) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easinessFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  newEasinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEasinessFactor < 1.3) {
    newEasinessFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString()
  };
};

export default function FlashcardReviewer({ cardsDue, onReviewComplete }) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [reviewsCompleted, setReviewsCompleted] = useState(0);

  const currentCard = cardsDue[currentCardIndex];
  const hasCards = cardsDue.length > 0;
  const isLastCard = currentCardIndex >= cardsDue.length - 1;

  useEffect(() => {
    setStartTime(Date.now());
    setShowAnswer(false);
  }, [currentCardIndex]);

  const handleQualityRating = async (quality) => {
    if (!currentCard) return;

    const reviewTime = Math.round((Date.now() - startTime) / 1000);
    
    // Buscar última revisão para obter dados atuais
    const previousReviews = await FlashcardReview.filter({ 
      flashcard_id: currentCard.id 
    });
    
    const lastReview = previousReviews.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];

    const currentEasiness = lastReview?.easiness_factor || 2.5;
    const currentInterval = lastReview?.interval || 1;
    const currentRepetitions = lastReview?.repetitions || 0;

    const nextReviewData = calculateNextReview(
      quality, 
      currentEasiness, 
      currentInterval, 
      currentRepetitions
    );

    // Salvar revisão
    await FlashcardReview.create({
      flashcard_id: currentCard.id,
      quality,
      easiness_factor: nextReviewData.easinessFactor,
      interval: nextReviewData.interval,
      repetitions: nextReviewData.repetitions,
      next_review_date: nextReviewData.nextReviewDate,
      review_time_seconds: reviewTime
    });

    setReviewsCompleted(prev => prev + 1);

    if (isLastCard) {
      // Sessão concluída
      alert(`🎉 Parabéns! Você completou ${cardsDue.length} cartões hoje!`);
      onReviewComplete();
    } else {
      // Próximo cartão
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  if (!hasCards) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            🎉 Parabéns! Não há cartões para revisar hoje!
          </h3>
          <p className="text-gray-600">
            Todos os seus flashcards estão em dia. Continue assim!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Cartão {currentCardIndex + 1} de {cardsDue.length}
          </span>
          <span className="text-sm text-gray-500">
            {reviewsCompleted} revisados
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex + 1) / cardsDue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="min-h-[400px] cursor-pointer" onClick={!showAnswer ? handleShowAnswer : undefined}>
            <CardContent className="p-8 flex flex-col justify-center items-center text-center">
              <div className="mb-4">
                <Badge className="bg-indigo-100 text-indigo-800">
                  {currentCard.subject}
                </Badge>
                {currentCard.topic && (
                  <Badge variant="outline" className="ml-2">
                    {currentCard.topic}
                  </Badge>
                )}
              </div>

              {!showAnswer ? (
                <div className="space-y-6">
                  <div 
                    className="text-xl font-medium text-gray-900"
                    dangerouslySetInnerHTML={{ __html: currentCard.front }}
                  />
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Eye className="w-5 h-5" />
                    <span>Clique para ver a resposta</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 w-full">
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500 mb-2">Pergunta:</div>
                    <div 
                      className="text-lg font-medium text-gray-900"
                      dangerouslySetInnerHTML={{ __html: currentCard.front }}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Resposta:</div>
                    <div 
                      className="text-lg text-gray-800"
                      dangerouslySetInnerHTML={{ __html: currentCard.back }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4 mt-6"
        >
          <Button
            onClick={() => handleQualityRating(0)}
            className="bg-red-600 hover:bg-red-700 text-white flex flex-col"
          >
            <span>Again</span>
            <span className="text-xs opacity-75">menos de 1min</span>
          </Button>
          <Button
            onClick={() => handleQualityRating(1)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex flex-col"
          >
            <span>Hard</span>
            <span className="text-xs opacity-75">menos de 6min</span>
          </Button>
          <Button
            onClick={() => handleQualityRating(2)}
            className="bg-green-600 hover:bg-green-700 text-white flex flex-col"
          >
            <span>Good</span>
            <span className="text-xs opacity-75">menos de 10min</span>
          </Button>
          <Button
            onClick={() => handleQualityRating(3)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex flex-col"
          >
            <span>Easy</span>
            <span className="text-xs opacity-75">4 dias</span>
          </Button>
        </motion.div>
      )}

      {!showAnswer && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleShowAnswer} size="lg">
            <Eye className="w-5 h-5 mr-2" />
            Mostrar Resposta
          </Button>
        </div>
      )}
    </div>
  );
}