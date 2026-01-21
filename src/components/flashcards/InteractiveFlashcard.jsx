import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, RotateCw, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

export default function InteractiveFlashcard({
  flashcard,
  onNext,
  onPrevious,
  currentIndex,
  totalCards,
  onReview
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Progress */}
      <div className="text-center mb-8">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Cartão {currentIndex + 1} de {totalCards}
        </p>
        <div className="w-64 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mt-2 mx-auto">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <motion.div
        className="mb-8 perspective w-full max-w-2xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.div
          className="relative w-full h-96 cursor-pointer"
          onClick={handleFlip}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <Card
            className={`absolute inset-0 flex items-center justify-center transition-all ${
              !isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center p-8">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Pergunta
              </p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {flashcard.front}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Clique para virar o cartão
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 transition-all ${
              isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="text-center p-8">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-4">
                Resposta
              </p>
              <h2 className="text-3xl font-bold text-white leading-relaxed">
                {flashcard.back}
              </h2>
              <p className="text-sm text-white/60 mt-6">
                Clique para virar novamente
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <Button
          variant="outline"
          onClick={() => handleSpeak(isFlipped ? flashcard.back : flashcard.front)}
          title="Ouvir pronuncia"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Ouvir
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowHint(!showHint)}
          title="Dica"
        >
          💡 Dica
        </Button>
      </div>

      {/* Difficulty Rating */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 w-full max-w-2xl"
        >
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            Quão fácil foi?
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Muito Difícil', value: 0, color: 'red' },
              { label: 'Difícil', value: 1, color: 'orange' },
              { label: 'Fácil', value: 2, color: 'green' },
              { label: 'Muito Fácil', value: 3, color: 'blue' }
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => onReview && onReview(option.value)}
                variant="outline"
                className={`border-2 transition-all ${
                  option.color === 'red' ? 'hover:bg-red-50 dark:hover:bg-red-900/20' :
                  option.color === 'orange' ? 'hover:bg-orange-50 dark:hover:bg-orange-900/20' :
                  option.color === 'green' ? 'hover:bg-green-50 dark:hover:bg-green-900/20' :
                  'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          variant="outline"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button onClick={handleFlip} variant="default" className="bg-blue-600 hover:bg-blue-700">
          <RotateCw className="w-4 h-4 mr-2" />
          Virar
        </Button>
        <Button
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
          variant="outline"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}