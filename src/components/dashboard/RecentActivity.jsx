
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática", 
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  direito_tributario: "Direito Tributário",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  legislacao_especifica: "Legislação Específica",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  administracao_publica: "Administração Pública",
  economia: "Economia",
  estatistica: "Estatística"
};

export default function RecentActivity({ answers, isLoading }) {
  const recentAnswers = answers.slice(0, 10);

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Clock className="w-5 h-5 text-indigo-600" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))
          ) : recentAnswers.length > 0 ? (
            recentAnswers.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                  answer.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    answer.is_correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {answer.is_correct ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <XCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {subjectNames[answer.subject] || answer.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(answer.created_date), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={answer.is_correct ? "default" : "destructive"}
                  className="font-semibold"
                >
                  {answer.is_correct ? 'Acerto' : 'Erro'}
                </Badge>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma questão resolvida ainda.</p>
              <p className="text-sm mt-2">Comece resolvendo algumas questões!</p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
