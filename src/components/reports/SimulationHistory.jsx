import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SimulationHistory({ simulations, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Histórico de Simulados
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (simulations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Histórico de Simulados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum simulado realizado neste período.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedSimulations = [...simulations].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Histórico de Simulados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSimulations.map((sim) => {
            const scorePercentage = sim.score ? (sim.score / sim.question_count) * 100 : 0;
            const scoreColor = scorePercentage >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 
                              scorePercentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';

            return (
              <div key={sim.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{sim.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(sim.created_date), 'dd MMM yyyy', { locale: ptBR })}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={scoreColor}>
                    {sim.score}/{sim.question_count} ({scorePercentage.toFixed(1)}%)
                  </Badge>
                  {sim.total_time && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {sim.total_time} min
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}