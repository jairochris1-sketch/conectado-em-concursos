import React from "react";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, addMonths } from "date-fns";

const dayShort = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function CalendarNav({ schedule, weekStart, onChange }) {
  const minDate = new Date(schedule.start_date);
  const maxDate = new Date(schedule.end_date);

  const canPrev = addDays(weekStart, -7) >= startOfWeek(minDate, { weekStartsOn: 0 });
  const canNext = addDays(weekStart, 7) <= startOfWeek(maxDate, { weekStartsOn: 0 });

  const handlePrev = () => canPrev && onChange(addDays(weekStart, -7));
  const handleNext = () => canNext && onChange(addDays(weekStart, 7));

  const monthStart = startOfMonth(weekStart);
  const monthEnd = endOfMonth(weekStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });

  const days = [];
  for (let d = 0; ; d++) {
    const date = addDays(gridStart, d);
    if (date > monthEnd && date.getDay() === 0) break;
    days.push(date);
  }

  const fmtMonth = weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full md:w-64 border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <Button size="sm" variant="outline" onClick={handlePrev} disabled={!canPrev}>◀</Button>
        <div className="text-sm font-semibold capitalize">{fmtMonth}</div>
        <Button size="sm" variant="outline" onClick={handleNext} disabled={!canNext}>▶</Button>
      </div>

      <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-1">
        {dayShort.map(d => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          const isInMonth = d.getMonth() === monthStart.getMonth();
          const isInWeek = d >= weekStart && d < addDays(weekStart, 7);
          return (
            <button
              key={idx}
              onClick={() => onChange(startOfWeek(d, { weekStartsOn: 0 }))}
              className={`h-8 rounded text-xs flex items-center justify-center border ${isInWeek ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-gray-200'} ${isInMonth ? 'text-gray-800' : 'text-gray-400'}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}