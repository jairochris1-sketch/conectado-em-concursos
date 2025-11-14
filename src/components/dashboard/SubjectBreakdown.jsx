import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "D. Constitucional",
  direito_administrativo: "D. Administrativo",
  direito_penal: "D. Penal",
  direito_civil: "D. Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais"
};

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function SubjectBreakdown({ answers, isLoading }) {
  if (isLoading || !answers || answers.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Performance por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Resolva questões para ver suas estatísticas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar respostas por disciplina
  const subjectStats = {};
  answers.forEach(answer => {
    if (!subjectStats[answer.subject]) {
      subjectStats[answer.subject] = { total: 0, correct: 0 };
    }
    subjectStats[answer.subject].total++;
    if (answer.is_correct) {
      subjectStats[answer.subject].correct++;
    }
  });

  // Converter para array e calcular percentuais
  const chartData = Object.entries(subjectStats)
    .map(([subject, data]) => ({
      name: subjectNames[subject] || subject,
      total: data.total,
      correct: data.correct,
      accuracy: Math.round((data.correct / data.total) * 100),
      percentage: Math.round((data.total / answers.length) * 100)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Performance por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de pizza */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} questões (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de disciplinas */}
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-sm text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.accuracy}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.correct}/{item.total}
                    </div>
                  </div>
                </div>
              ))}
              
              {chartData.length === 0 && (
                <div className="text-center py-4">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma questão respondida ainda</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}