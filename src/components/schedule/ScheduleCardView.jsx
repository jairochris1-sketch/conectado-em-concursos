import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek } from "date-fns";
import CalendarNav from "./CalendarNav";
import WeeklyBoard from "./WeeklyBoard";
import { base44 } from "@/api/base44Client";

const order = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

export default function ScheduleCardView({ schedule, onChange }) {
  const defaultWeek = useMemo(() => startOfWeek(new Date(schedule.start_date), { weekStartsOn: 0 }), [schedule.start_date]);
  const [weekStart, setWeekStart] = useState(defaultWeek);
  const todayIdx = new Date().getDay(); // 0..6

  const replanOverdue = async () => {
    const items = [...(schedule?.schedule_items || [])];
    // Build day lists in current order
    const lists = order.reduce((acc, d) => ({ ...acc, [d]: items.filter(i => i.day_of_week === d) }), {});

    // Move items from days before todayIdx into today..end
    const moving = [];
    for (let i = 0; i < todayIdx; i++) {
      const dkey = order[i];
      while ((lists[dkey] || []).length) {
        moving.push(lists[dkey].shift());
      }
    }

    // Append into today..end sequentially
    let cursor = todayIdx;
    moving.forEach((it) => {
      const dkey = order[cursor];
      it.day_of_week = dkey;
      lists[dkey].push(it);
      cursor = cursor < 6 ? cursor + 1 : 6; // keep filling last day if overflow
    });

    // Recompose items preserving intra-day order
    const newItems = order.flatMap(d => lists[d]);

    await base44.entities.StudySchedule.update(schedule.id, { schedule_items: newItems });
    onChange?.(newItems);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
      <Card className="bg-white/90">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Semana de {weekStart.toLocaleDateString('pt-BR')}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={replanOverdue}>Replanejar atrasados</Button>
            </div>
          </div>
          <WeeklyBoard schedule={schedule} onChange={onChange} weekStart={weekStart} />
        </CardContent>
      </Card>

      <div>
        <CalendarNav schedule={schedule} weekStart={weekStart} onChange={setWeekStart} />
      </div>
    </div>
  );
}