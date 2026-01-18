import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';

export default function UserComparison({ userStats, averageStats, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Comparação com Média
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const comparisonData = [
    {
      name: 'Taxa de Acerto',
      você: userStats.taxaAcerto,
      média: averageStats.taxaAcerto,
    },
    {
      name: 'Questões Respondidas',
      você: Math.min(userStats.questoes / 10, 100),
      média: Math.min(averageStats.questoes / 10, 100),
    },
  ];

  const isAboveAverage = userStats.taxaAcerto > averageStats.taxaAcerto;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Comparação com Média
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9ca3af" />
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
            <Bar dataKey="você" fill="#3b82f6" name="Você" />
            <Bar dataKey="média" fill="#9ca3af" name="Média" />
          </BarChart>
        </ResponsiveContainer>

        <div className={`mt-4 p-3 rounded-lg ${isAboveAverage ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isAboveAverage ? 'text-green-600' : 'text-blue-600'}`} />
            <p className={`text-sm font-medium ${isAboveAverage ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
              {isAboveAverage ? (
                <>
                  Você está <strong>{(userStats.taxaAcerto - averageStats.taxaAcerto).toFixed(1)}%</strong> acima da média!
                </>
              ) : (
                <>
                  Você está <strong>{(averageStats.taxaAcerto - userStats.taxaAcerto).toFixed(1)}%</strong> abaixo da média. Continue estudando!
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}