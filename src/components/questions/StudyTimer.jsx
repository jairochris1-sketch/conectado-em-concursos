import React, { useState, useEffect, useCallback } from "react";
import { Clock, Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos padrão
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Mostrar notificação de pausa
      toast.success("⏰ Hora da Pausa!", {
        description: "É hora de descansar! Que tal tomar uma água, fazer um lanche ou esticar as pernas? 🚶‍♂️💧",
        duration: 10000,
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(customMinutes * 60);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(customMinutes * 60);
  };

  const handleSetTime = () => {
    if (customMinutes > 0 && customMinutes <= 180) {
      setTimeLeft(customMinutes * 60);
      setIsRunning(false);
      setShowSettings(false);
      toast.success(`⏱️ Cronômetro ajustado para ${customMinutes} minutos!`);
    } else {
      toast.error("Por favor, escolha um tempo entre 1 e 180 minutos.");
    }
  };

  const progress = ((customMinutes * 60 - timeLeft) / (customMinutes * 60)) * 100;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 relative"
      >
        <Clock className="w-5 h-5" />
        {isRunning && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              Cronômetro de Estudos
            </DialogTitle>
            <DialogDescription>
              Configure seu tempo de estudo e faça pausas regulares para melhor aproveitamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {showSettings ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minutes">Tempo (minutos)</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Escolha entre 1 e 180 minutos
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetTime} className="flex-1">
                    Aplicar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                        className="text-red-500 transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900">
                          {formatTime(timeLeft)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {isRunning ? "Estudando..." : timeLeft === 0 ? "Finalizado!" : "Pausado"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {!isRunning ? (
                      <Button
                        onClick={handleStart}
                        size="lg"
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        {timeLeft === customMinutes * 60 ? "Iniciar" : "Retomar"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePause}
                        size="lg"
                        variant="outline"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pausar
                      </Button>
                    )}
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      size="lg"
                      variant="outline"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
                  <p className="font-medium mb-1">💡 Dica de Estudo</p>
                  <p>
                    Estudos mostram que pausas regulares melhoram a retenção de conteúdo.
                    Quando o cronômetro terminar, aproveite para se hidratar e relaxar!
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}