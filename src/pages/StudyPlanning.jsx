import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Target, RefreshCcw, ArrowRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const options = [
  {
    title: "Cronograma de Estudos",
    description: "Um planejamento fixo que define dias e horários específicos para cada disciplina.",
    icon: Calendar,
    url: createPageUrl("Schedule"),
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800"
  },
  {
    title: "Ciclo de Estudos",
    description: "Modelo moderno sem dias fixos, focado no tempo dedicado a sessões em sequência contínua.",
    icon: RefreshCcw,
    url: createPageUrl("StudyCycle"),
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800"
  },
  {
    title: "Planos de Estudo",
    description: "Crie planos personalizados com metas semanais de questões e horas.",
    icon: Target,
    url: createPageUrl("StudyPlans"),
    color: "bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    border: "border-green-200 dark:border-green-800"
  }
];

export default function StudyPlanningPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-400" />
          Planejamento de Estudos
        </h1>
        <p className="text-gray-400 mt-2">Escolha como deseja organizar seus estudos.</p>
      </div>

      <div className="grid gap-5">
        {options.map((opt) => (
          <Link to={opt.url} key={opt.title}>
            <Card className={`hover:shadow-lg transition-all duration-200 border-2 ${opt.border} hover:scale-[1.01] cursor-pointer`}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`p-4 rounded-xl ${opt.color} flex-shrink-0`}>
                  <opt.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900">{opt.title}</h2>
                  <p className="text-gray-500 mt-1 text-sm">{opt.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}