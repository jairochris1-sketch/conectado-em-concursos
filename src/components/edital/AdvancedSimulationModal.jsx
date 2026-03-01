import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Play, ChevronDown, ChevronUp, CheckSquare, Square, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "Todas", color: "bg-gray-100 text-gray-700 border-gray-300", activeColor: "bg-gray-600 text-white border-gray-600" },
  { value: "facil", label: "Fácil", color: "bg-green-50 text-green-700 border-green-300", activeColor: "bg-green-600 text-white border-green-600" },
  { value: "medio", label: "Médio", color: "bg-yellow-50 text-yellow-700 border-yellow-300", activeColor: "bg-yellow-500 text-white border-yellow-500" },
  { value: "dificil", label: "Difícil", color: "bg-red-50 text-red-700 border-red-300", activeColor: "bg-red-600 text-white border-red-600" },
];

export default function AdvancedSimulationModal({ isOpen, onClose, edital, onGenerate, isGenerating }) {
  const [selectedDisciplines, setSelectedDisciplines] = useState({});
  const [globalDifficulty, setGlobalDifficulty] = useState("all");
  const [totalQuestions, setTotalQuestions] = useState(0);

  const disciplinas = edital?.subjects_content?.disciplinas || [];

  useEffect(() => {
    if (!isOpen || disciplinas.length === 0) return;
    // Inicializar com todas as disciplinas selecionadas e distribuição igual
    const perDisc = Math.max(2, Math.round(20 / disciplinas.length));
    const initial = {};
    disciplinas.forEach(d => {
      initial[d.nome] = {
        selected: true,
        count: d.numero_questoes || perDisc,
        difficulty: "all"
      };
    });
    setSelectedDisciplines(initial);
    setGlobalDifficulty("all");
  }, [isOpen, edital]);

  useEffect(() => {
    const total = Object.values(selectedDisciplines)
      .filter(d => d.selected)
      .reduce((acc, d) => acc + (d.count || 0), 0);
    setTotalQuestions(total);
  }, [selectedDisciplines]);

  const toggleDiscipline = (nome) => {
    setSelectedDisciplines(prev => ({
      ...prev,
      [nome]: { ...prev[nome], selected: !prev[nome]?.selected }
    }));
  };

  const setCount = (nome, value) => {
    const count = Math.max(1, Math.min(50, parseInt(value) || 1));
    setSelectedDisciplines(prev => ({
      ...prev,
      [nome]: { ...prev[nome], count }
    }));
  };

  const setDifficultyForDisc = (nome, diff) => {
    setSelectedDisciplines(prev => ({
      ...prev,
      [nome]: { ...prev[nome], difficulty: diff }
    }));
  };

  const applyGlobalDifficulty = (diff) => {
    setGlobalDifficulty(diff);
    setSelectedDisciplines(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => {
        updated[k] = { ...prev[k], difficulty: diff };
      });
      return updated;
    });
  };

  const selectAll = () => {
    setSelectedDisciplines(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => { updated[k] = { ...prev[k], selected: true }; });
      return updated;
    });
  };

  const deselectAll = () => {
    setSelectedDisciplines(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => { updated[k] = { ...prev[k], selected: false }; });
      return updated;
    });
  };

  const handleGenerate = () => {
    const active = Object.entries(selectedDisciplines).filter(([, v]) => v.selected);
    if (active.length === 0) {
      toast.error("Selecione pelo menos uma disciplina");
      return;
    }
    if (totalQuestions === 0) {
      toast.error("Defina pelo menos 1 questão no total");
      return;
    }

    const disciplineConfig = active.map(([nome, cfg]) => ({
      nome,
      count: cfg.count,
      difficulty: cfg.difficulty
    }));

    onGenerate({
      discipline_config: disciplineConfig,
      total_questions: totalQuestions
    });
  };

  const selectedCount = Object.values(selectedDisciplines).filter(d => d.selected).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            ⚙️ Configuração Avançada do Simulado
          </DialogTitle>
          <DialogDescription>
            {edital?.concurso_name} — Personalize disciplinas, quantidade e dificuldade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Dificuldade Global */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              Nível de Dificuldade (global)
            </Label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => applyGlobalDifficulty(opt.value)}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    globalDifficulty === opt.value ? opt.activeColor : opt.color
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Aplica o nível escolhido a todas as disciplinas. Você pode ajustar individualmente abaixo.</p>
          </div>

          {/* Disciplinas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Disciplinas ({selectedCount}/{disciplinas.length} selecionadas)
              </Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 px-2">Todas</Button>
                <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7 px-2 text-red-500">Nenhuma</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {disciplinas.map((disc) => {
                const cfg = selectedDisciplines[disc.nome] || { selected: false, count: 2, difficulty: "all" };
                return (
                  <div
                    key={disc.nome}
                    className={`rounded-lg border p-3 transition-all ${
                      cfg.selected
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
                        : "border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button onClick={() => toggleDiscipline(disc.nome)} className="flex-shrink-0">
                        {cfg.selected
                          ? <CheckSquare className="w-5 h-5 text-blue-600" />
                          : <Square className="w-5 h-5 text-gray-400" />}
                      </button>

                      {/* Nome + peso */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{disc.nome}</p>
                        {disc.peso && (
                          <p className="text-xs text-gray-500">Peso: {disc.peso}</p>
                        )}
                      </div>

                      {/* Nível individual */}
                      {cfg.selected && (
                        <div className="flex gap-1 flex-shrink-0">
                          {DIFFICULTY_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setDifficultyForDisc(disc.nome, opt.value)}
                              className={`px-2 py-0.5 rounded text-xs border font-medium transition-all ${
                                cfg.difficulty === opt.value ? opt.activeColor : opt.color
                              }`}
                            >
                              {opt.label === "Todas" ? "Todas" : opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Qtd questões */}
                      {cfg.selected && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setCount(disc.nome, cfg.count - 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={cfg.count}
                            onChange={(e) => setCount(disc.nome, e.target.value)}
                            className="w-12 text-center text-sm border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => setCount(disc.nome, cfg.count + 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-xs text-gray-500 ml-1">q.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de questões</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalQuestions}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCount} disciplina(s)</p>
              <p className="text-xs text-gray-500 capitalize">Dificuldade: {globalDifficulty === "all" ? "mista" : globalDifficulty}</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || totalQuestions === 0 || selectedCount === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Gerar Simulado ({totalQuestions} q.)</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}