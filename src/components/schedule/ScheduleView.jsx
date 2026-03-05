import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import { useMemo } from "react";

const dayNames = {
  'monday': 'Segunda',
  'tuesday': 'Terça',
  'wednesday': 'Quarta',
  'thursday': 'Quinta',
  'friday': 'Sexta',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const activityColors = {
  'teoria': 'bg-blue-100 text-blue-800 border-blue-200',
  'questoes': 'bg-green-100 text-green-800 border-green-200',
  'revisao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'simulado': 'bg-purple-100 text-purple-800 border-purple-200'
};

export default function ScheduleView({ schedule }) {
  // Generate the grid structure
  const grid = useMemo(() => {
    if (!schedule.schedule_items || schedule.schedule_items.length === 0) return { times: [], matrix: {} };

    // Find all unique timeslots
    const times = [...new Set(schedule.schedule_items.map(item => `${item.start_time} - ${item.end_time}`))];
    
    // Sort times numerically by start hour
    times.sort((a, b) => {
      const [hA, mA] = a.split(' - ')[0].split(':').map(Number);
      const [hB, mB] = b.split(' - ')[0].split(':').map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    });

    const matrix = {};
    times.forEach(time => {
      matrix[time] = {};
      dayOrder.forEach(day => {
        matrix[time][day] = [];
      });
    });

    schedule.schedule_items.forEach(item => {
      const timeKey = `${item.start_time} - ${item.end_time}`;
      if (matrix[timeKey] && matrix[timeKey][item.day_of_week]) {
        matrix[timeKey][item.day_of_week].push(item);
      }
    });

    // Determine which days have actual content to avoid empty columns
    const activeDays = dayOrder.filter(day => 
      schedule.schedule_items.some(item => item.day_of_week === day)
    );

    return { times, matrix, activeDays };
  }, [schedule]);

  if (!schedule.schedule_items || schedule.schedule_items.length === 0) {
    return <div className="p-4 text-center text-gray-500">Nenhum horário cadastrado neste cronograma.</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse min-w-[800px] text-sm text-left">
        <thead>
          <tr className="bg-gray-100/80 border-b border-gray-200">
            <th className="p-4 font-semibold text-gray-700 border-r border-gray-200 w-32 text-center bg-gray-100">
              <div className="flex items-center justify-center gap-1.5 text-indigo-700">
                <Clock className="w-4 h-4" /> Horário
              </div>
            </th>
            {grid.activeDays.map(day => (
              <th key={day} className="p-4 font-bold text-gray-800 text-center uppercase tracking-wide bg-gray-50/50">
                {dayNames[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {grid.times.map((time, idx) => (
            <tr key={time} className="hover:bg-gray-50/30 transition-colors">
              <td className="p-3 border-r border-gray-200 text-center font-medium text-gray-600 bg-gray-50/30 whitespace-nowrap">
                {time}
              </td>
              {grid.activeDays.map(day => {
                const items = grid.matrix[time][day];
                return (
                  <td key={day} className="p-2 border-r border-gray-100 border-dashed align-top">
                    {items && items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div 
                            key={i} 
                            className={`p-3 rounded-lg border ${activityColors[item.activity_type] || 'bg-gray-50 border-gray-200'} shadow-sm flex flex-col h-full justify-between`}
                          >
                            <div className="font-bold text-gray-900 leading-tight mb-1">
                              {item.subject}
                            </div>
                            {item.topic && (
                              <div className="text-xs text-gray-600 mb-2 leading-snug line-clamp-2">
                                {item.topic}
                              </div>
                            )}
                            <div className="mt-auto pt-2 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                {item.activity_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full w-full min-h-[60px] rounded-md border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-gray-400 text-xs">
                        -
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}