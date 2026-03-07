import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Repeat, Link as LinkIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateStudyPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const selectedMode = urlParams.get("mode");

  const options = [
    {
      key: "weekly",
      title: "Trilha Semanal",
      description:
        "Organize seus estudos por dias da semana sem datas fixas, permitindo total flexibilidade.",
      icon: LinkIcon,
      accent: "border-orange-200 hover:border-orange-300 bg-orange-50/40",
    },
    {
      key: "schedule",
      title: "Cronograma de Estudos",
      description:
        "Um planejamento fixo que define dias e horários específicos para cada disciplina.",
      icon: Calendar,
      accent: "border-blue-200 hover:border-blue-300 bg-blue-50/40",
    },
    {
      key: "cycle",
      title: "Ciclo de Estudos",
      description:
        "Modelo moderno sem dias fixos, focado no tempo dedicado a sessões em sequência contínua.",
      icon: Repeat,
      accent: "border-purple-200 hover:border-purple-300 bg-purple-50/40",
    },
  ];

  const handleSelect = (mode) => {
    navigate(createPageUrl("CreateStudyPlan") + `?mode=${mode}`);
  };

  return (
    <div className="min-h-[70vh] w-full max-w-4xl mx-auto px-4 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 text-blue-600" style={{ color: "var(--primary-color)" }}>
          <Calendar className="w-5 h-5" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
            Planejamento de Estudos
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
          Escolha como deseja organizar seus estudos.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelect(opt.key)}
              className={`w-full text-left rounded-xl border ${opt.accent} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-4 md:p-5 bg-white/70 dark:bg-slate-900/60`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" style={{ color: "var(--primary-color)" }} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                      {opt.title}
                    </h3>
                    <p className="text-sm md:text-[15px] text-gray-600 dark:text-gray-300 mt-1">
                      {opt.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              </div>
            </button>
          );
        })}
      </div>

      {selectedMode && (
        <div className="mt-6 p-3 md:p-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm md:text-base flex items-center justify-between gap-3 flex-wrap">
          <span>
            Modo selecionado: <strong>{
              selectedMode === "weekly" ? "Trilha Semanal" : selectedMode === "schedule" ? "Cronograma de Estudos" : "Ciclo de Estudos"
            }</strong>. Me diga como você quer configurar e eu preparo a próxima etapa.
          </span>
          {selectedMode === "weekly" && (
            <Button size="sm" onClick={() => navigate(createPageUrl("WeeklyTrack"))}>
              Abrir Trilha Semanal
            </Button>
          )}
        </div>
      )}
    </div>
  );
}