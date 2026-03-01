import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, AlertCircle, TrendingUp } from 'lucide-react';

export default function SubjectPerformance({ data, loading }) {
  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Desempenho por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => a.taxa - b.taxa);
  const needsImprovement = sortedData.filter(d => d.total >= 3).slice(0, 3);
  
  const sortedDataDesc = [...data].sort((a, b) => b.taxa - a.taxa);
  const strengths = sortedDataDesc.filter(d => d.total >= 3).slice(0, 3);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Desempenho por Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="disciplina" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="acertos" fill="#3b82f6" name="Acertos" />
            <Bar dataKey="total" fill="#d1d5db" name="Total" />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {strengths.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Pontos Fortes</h4>
                  <ul className="space-y-1 text-sm text-green-800 dark:text-green-300">
                    {strengths.map((subject) => (
                      <li key={subject.disciplina}>
                        <strong>{subject.disciplina}</strong>: {subject.taxa.toFixed(1)}% de acerto ({subject.acertos}/{subject.total})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {needsImprovement.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Áreas para Melhoria</h4>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                    {needsImprovement.map((subject) => (
                      <li key={subject.disciplina}>
                        <strong>{subject.disciplina}</strong>: {subject.taxa.toFixed(1)}% de acerto ({subject.acertos}/{subject.total})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}