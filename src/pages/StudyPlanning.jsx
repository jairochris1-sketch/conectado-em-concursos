import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Target, RefreshCcw, ArrowRight, Info, Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const options = [
  {
    title: "Trilha Semanal",
    description: "Organize seus estudos por dias da semana sem datas fixas, permitindo total flexibilidade.",
    icon: Footprints,
    url: createPageUrl("WeeklyTrail"),
    color: "bg-orange-50 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800"
  },
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
            <Card className={`hover:shadow-lg transition-all duration-200 border-2 ${opt.border} hover:scale-[1.01] cursor-pointer bg-white dark:bg-gray-800`}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`p-4 rounded-xl ${opt.color} flex-shrink-0`}>
                  <opt.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{opt.title}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{opt.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Entenda cada modelo</h2>
        
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-orange-100 dark:border-orange-900 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-3">
              <Footprints className="w-5 h-5" />
              Trilha Semanal
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
              Uma trilha semanal é um calendário sem datas fixas, apenas dias da semana (segunda a domingo), onde você define tarefas diárias com objetivos claros. Na prática, você cria uma "trilha" de tarefas e a segue.
              <br /><br />
              Por exemplo: Segunda-feira: Português (2h) + Resolver 10 questões. Terça-feira: Matemática (1h30). Quando uma tarefa é finalizada, ela é marcada como "concluída", permitindo ajustes e priorização.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-blue-900 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" />
              Cronograma de Estudos
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
              Um cronograma é um planejamento fixo que define dias e horários específicos para cada disciplina. Por exemplo: segunda-feira das 14h às 16h para Matemática, terça-feira para Português, e por aí vai...
              <br /><br />
              Podemos dizer que o cronograma representa um modelo mais "convencional" de controle de tarefas e atividades. É ideal para quem possui uma rotina fixa e gosta de saber exatamente o que vai estudar em cada dia da semana.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-100 dark:border-purple-900 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2 mb-3">
              <RefreshCcw className="w-5 h-5" />
              Ciclo de Estudos
            </h3>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <p className="mb-4">
                O Ciclo de Estudos é um modelo mais moderno, que prioriza o tempo dedicado a cada matéria, sem dias fixos. Ele é composto de diversas "sessões" de estudo com horários pré-determinados. Em geral, cada sessão de estudo se refere a uma disciplina, e você as estuda em sequência, retomando de onde parou após interrupções.
              </p>
              <p className="mb-4">Por exemplo, você poderia montar um Ciclo de Estudos com as seguintes sessões:</p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-100 dark:border-gray-700">
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="font-medium">Sessão</span>
                    <span className="font-medium">Duração</span>
                  </li>
                  <li className="flex justify-between"><span>Português</span> <span>2 horas</span></li>
                  <li className="flex justify-between"><span>Raciocínio Lógico</span> <span>2 horas</span></li>
                  <li className="flex justify-between"><span>Direito Constitucional</span> <span>2 horas</span></li>
                  <li className="flex justify-between"><span>Direito Administrativo</span> <span>2 horas</span></li>
                  <li className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2"><span>Noções de Informática</span> <span>1 hora</span></li>
                  <li className="flex justify-between font-bold pt-2"><span>Total</span> <span>9 horas</span></li>
                </ul>
              </div>
              <p className="mb-4">
                Ao iniciar os estudos do Ciclo, você primeiro estuda 2h de Português, depois 2h de Raciocínio Lógico, e assim por diante. Ao final do ciclo você terá concluído 9 horas de estudo, quando então você reinicia as sessões.
              </p>
              <p>
                O Ciclo de Estudos representa um conceito simples de rodízio de matérias, mas ele traz consigo diversas implicações cognitivas que favorecem o aprendizado e a fixação dos conteúdos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}