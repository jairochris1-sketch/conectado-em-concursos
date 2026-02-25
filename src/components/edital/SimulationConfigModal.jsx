import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function SimulationConfigModal({ isOpen, onClose, edital, onGenerateSimulation, isGenerating }) {
  const [config, setConfig] = useState({});
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (edital?.subjects_content?.disciplinas) {
      const initialConfig = {};
      edital.subjects_content.disciplinas.forEach(disciplina => {
        initialConfig[disciplina.nome] = 5;
      });
      setConfig(initialConfig);
      calculateTotal(initialConfig);
    }
  }, [edital]);

  const calculateTotal = (cfg) => {
    const total = Object.values(cfg).reduce((sum, val) => sum + val, 0);
    setTotalQuestions(total);
  };

  const handleQuantityChange = (disciplina, value) => {
    const newConfig = { ...config, [disciplina]: Math.max(0, Math.min(50, value)) };
    setConfig(newConfig);
    calculateTotal(newConfig);
  };

  const handleSliderChange = (disciplina, value) => {
    handleQuantityChange(disciplina, value[0]);
  };

  const handleGenerate = () => {
    if (totalQuestions === 0) {
      toast.error("Selecione pelo menos 1 questão");
      return;
    }
    onGenerateSimulation(config, totalQuestions);
  };

  const distributeEqually = () => {
    const disciplinas = edital.subjects_content.disciplinas;
    const perDisciplina = Math.floor(20 / disciplinas.length);
    const newConfig = {};
    disciplinas.forEach(d => {
      newConfig[d.nome] = perDisciplina;
    });
    setConfig(newConfig);
    calculateTotal(newConfig);
  };

  if (!edital?.subjects_content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Configurar Simulado Personalizado
          </DialogTitle>
          <DialogDescription>
            Escolha quantas questões deseja de cada disciplina do edital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de questões: <span className="text-2xl font-bold text-blue-600">{totalQuestions}</span>
              </p>
            </div>
            <Button
              onClick={distributeEqually}
              variant="outline"
              size="sm"
            >
              Distribuir igualmente (20 questões)
            </Button>
          </div>

          <div className="space-y-4">
            {edital.subjects_content.disciplinas.map((disciplina) => (
              <Card key={disciplina.nome} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {disciplina.nome}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {disciplina.topicos?.slice(0, 3).map((topico, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topico}
                          </Badge>
                        ))}
                        {disciplina.topicos?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{disciplina.topicos.length - 3} tópicos
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={config[disciplina.nome] || 0}
                      onChange={(e) => handleQuantityChange(disciplina.nome, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[config[disciplina.nome] || 0]}
                      onValueChange={(val) => handleSliderChange(disciplina.nome, val)}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0 questões</span>
                      <span>50 questões</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalQuestions > 100 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Atenção: Simulados muito longos podem afetar seu desempenho. Recomendamos entre 20-50 questões.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || totalQuestions === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Simulado...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Gerar Simulado ({totalQuestions} questões)
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isGenerating}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}