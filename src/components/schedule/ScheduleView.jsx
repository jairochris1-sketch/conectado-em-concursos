import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Award, Target, Calendar as CalendarIcon } from "lucide-react";

const dayNames = {
  'monday': '🔵 Segunda',
  'tuesday': '🟢 Terça',
  'wednesday': '🟡 Quarta',
  'thursday': '🟠 Quinta',
  'friday': '🔴 Sexta',
  'saturday': '🟣 Sábado',
  'sunday': '🟤 Domingo'
};

const activityColors = {
  'teoria': 'bg-blue-500 text-white dark:bg-blue-600',
  'questoes': 'bg-green-500 text-white dark:bg-green-600',
  'revisao': 'bg-amber-500 text-white dark:bg-amber-600',
  'simulado': 'bg-purple-500 text-white dark:bg-purple-600'
};

const activityIcons = {
  'teoria': BookOpen,
  'questoes': Target,
  'revisao': Clock,
  'simulado': Award
};

export default function ScheduleView({ schedule }) {
  const groupedItems = schedule.schedule_items.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {});

  // Sort items within each day by start_time
  Object.keys(groupedItems).forEach(day => {
    groupedItems[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems)
        .sort(([a], [b]) => {
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          return dayOrder.indexOf(a) - dayOrder.indexOf(b);
        })
        .map(([day, items]) => (
          <div key={day} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-md">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {dayNames[day]}
            </h3>
            <div className="space-y-3">
              {items.map((item, index) => {
                const ActivityIcon = activityIcons[item.activity_type] || BookOpen;
                return (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            {item.start_time} - {item.end_time}
                          </div>
                          <Badge className={activityColors[item.activity_type] + ' flex items-center gap-1'}>
                            <ActivityIcon className="w-3 h-3" />
                            {item.activity_type === 'teoria' ? 'Teoria' :
                             item.activity_type === 'questoes' ? 'Questões' :
                             item.activity_type === 'revisao' ? 'Revisão' : 'Simulado'}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.subject}
                            </span>
                            {item.topic && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                • {item.topic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}