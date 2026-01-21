import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Target } from "lucide-react";

const dayNames = {
  'monday': 'Segunda',
  'tuesday': 'Terça',
  'wednesday': 'Quarta',
  'thursday': 'Quinta',
  'friday': 'Sexta',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

const activityColors = {
  'teoria': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'questoes': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'revisao': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'simulado': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
};

export default function ScheduleView({ schedule }) {
  const groupedItems = schedule.schedule_items.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {});

  // Calcular estatísticas
  const totalHours = schedule.schedule_items.reduce((sum, item) => {
    const [startH, startM] = item.start_time.split(':').map(Number);
    const [endH, endM] = item.end_time.split(':').map(Number);
    const duration = (endH * 60 + endM - (startH * 60 + startM)) / 60;
    return sum + duration;
  }, 0);

  const subjectCount = new Set(schedule.schedule_items.map(item => item.subject)).size;
  const activitiesByType = schedule.schedule_items.reduce((acc, item) => {
    acc[item.activity_type] = (acc[item.activity_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm opacity-90">Horas Semanais</span>
          </div>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm opacity-90">Disciplinas</span>
          </div>
          <p className="text-2xl font-bold">{subjectCount}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm opacity-90">Atividades</span>
          </div>
          <p className="text-2xl font-bold">{schedule.schedule_items.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm opacity-90">Dias da Semana</span>
          </div>
          <p className="text-2xl font-bold">{Object.keys(groupedItems).length}</p>
        </div>
      </div>

      {/* Distribuição de atividades */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Distribuição de Atividades</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(activitiesByType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <Badge className={activityColors[type]}>
                {type === 'teoria' ? 'Teoria' :
                 type === 'questoes' ? 'Questões' :
                 type === 'revisao' ? 'Revisão' : 'Simulado'}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">{count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cronograma por dia */}
      <div className="space-y-4">
        {Object.entries(groupedItems)
          .sort(([a], [b]) => {
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return dayOrder.indexOf(a) - dayOrder.indexOf(b);
          })
          .map(([day, items]) => (
            <div key={day} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                {dayNames[day]}
              </h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">
                        <Clock className="w-4 h-4" />
                        {item.start_time} - {item.end_time}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.subject}
                        </span>
                        {item.topic && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            • {item.topic}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={activityColors[item.activity_type]}>
                      {item.activity_type === 'teoria' ? 'Teoria' :
                       item.activity_type === 'questoes' ? 'Questões' :
                       item.activity_type === 'revisao' ? 'Revisão' : 'Simulado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}