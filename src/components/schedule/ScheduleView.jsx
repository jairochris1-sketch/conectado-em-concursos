
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";

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
  'teoria': 'bg-blue-100 text-blue-800',
  'questoes': 'bg-green-100 text-green-800',
  'revisao': 'bg-yellow-100 text-yellow-800',
  'simulado': 'bg-purple-100 text-purple-800'
};

export default function ScheduleView({ schedule }) {
  const groupedItems = schedule.schedule_items.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedItems)
        .sort(([a], [b]) => {
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          return dayOrder.indexOf(a) - dayOrder.indexOf(b);
        })
        .map(([day, items]) => (
          <div key={day} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {dayNames[day]}
            </h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {item.start_time} - {item.end_time}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-gray-900">
                        {item.subject}
                      </span>
                    </div>
                    {item.topic && (
                      <span className="text-sm text-gray-600">
                        - {item.topic}
                      </span>
                    )}
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
  );
}
