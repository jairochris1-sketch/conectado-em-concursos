import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function AudioPlayer({ onStart }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Criar áudio sintetizado
  const playStartAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Atenção candidatos, podem começar a prova. Boa sorte!"
      );
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        if (!hasStarted) {
          setHasStarted(true);
          onStart && onStart();
        }
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback se não houver suporte
      setTimeout(() => {
        setHasStarted(true);
        onStart && onStart();
      }, 3000);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-6">
      <Volume2 className="w-5 h-5 text-green-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800">
          {hasStarted ? "Prova iniciada! Boa sorte!" : "Clique para iniciar o áudio e começar a prova"}
        </p>
      </div>
      {!hasStarted && (
        <Button
          onClick={isPlaying ? stopAudio : playStartAudio}
          disabled={hasStarted}
          className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
          size="sm"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Iniciar Prova
            </>
          )}
        </Button>
      )}
    </div>
  );
}