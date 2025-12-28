import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática", 
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  informatica: "Informática",
};

export default function StudySuggestions({ answers }) {
  const getStudySuggestions = () => {
    if (!answers || answers.length < 10) return [];

    const subjectData = {};
    answers.forEach(answer => {
      if (!subjectData[answer.subject]) {
        subjectData[answer.subject] = { total: 0, errors: 0 };
      }
      subjectData[answer.subject].total++;
      if (!answer.is_correct) {
        subjectData[answer.subject].errors++;
      }
    });

    return Object.entries(subjectData)
      .map(([subject, data]) => ({
        subject,
        name: subjectNames[subject] || subject,
        total: data.total,
        errors: data.errors,
        errorRate: Math.round((data.errors / data.total) * 100)
      }))
      .filter(stat => stat.total >= 5) // Sugerir apenas para matérias com um número mínimo de respostas
      .sort((a, b) => b.errorRate - a.errorRate) // Ordenar pela maior taxa de erro
      .slice(0, 3);
  };

  const suggestions = getStudySuggestions();

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            Pontos para Melhorar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-orange-700">Com base nos seus erros recentes, foque nestas disciplinas para turbinar seu desempenho:</p>
          {suggestions.map(stat => (
            <div key={stat.subject} className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-800">{stat.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600 text-lg">{stat.errorRate}%</p>
                <p className="text-xs text-gray-500">de erro</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}