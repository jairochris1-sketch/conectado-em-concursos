import React, { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

const dayLabels = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

export default function WeeklyBoard({ schedule, onChange }) {
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const base = { sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] };
    (schedule?.schedule_items || []).forEach((it, idx) => {
      base[it.day_of_week] = base[it.day_of_week] || [];
      base[it.day_of_week].push({ ...it, _key: `${it.day_of_week}-${idx}` });
    });
    return base;
  }, [schedule]);

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;

    const fromDay = source.droppableId;
    const toDay = destination.droppableId;
    const fromIndex = source.index;
    const toIndex = destination.index;

    const items = [...(schedule?.schedule_items || [])];

    // Find the global index for source item
    const dayIndices = {};
    const order = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const dayLists = order.map(d => (schedule?.schedule_items || []).filter(i => i.day_of_week === d));
    const sourceItem = dayLists[order.indexOf(fromDay)][fromIndex];

    // Remove sourceItem (first match by identity)
    const removeIdx = items.findIndex(i => i === sourceItem);
    if (removeIdx === -1) return;
    const [moved] = items.splice(removeIdx, 1);
    moved.day_of_week = toDay; // update day

    // Compute insertion index in global items after move
    // Strategy: insert before the item currently at (toDay, toIndex) in the sequence order,
    // or append at the end of that day if index exceeds
    const newDayList = items.filter(i => i.day_of_week === toDay);
    if (toIndex >= newDayList.length) {
      // append at the last position of that day
      // find last index of that day in items
      let lastIdx = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].day_of_week === toDay) { lastIdx = i; break; }
      }
      const insertAt = lastIdx === -1 ? items.length : lastIdx + 1;
      items.splice(insertAt, 0, moved);
    } else {
      // insert before the item which is at toIndex in that day
      const target = newDayList[toIndex];
      const targetGlobalIdx = items.findIndex(i => i === target);
      const insertAt = targetGlobalIdx === -1 ? items.length : targetGlobalIdx;
      items.splice(insertAt, 0, moved);
    }

    setSaving(true);
    try {
      await base44.entities.StudySchedule.update(schedule.id, { schedule_items: items });
      onChange?.(items);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-w-[900px]">
          {Object.keys(groups).map((day) => (
            <div key={day} className="bg-gray-50 rounded-lg p-2">
              <div className="text-sm font-semibold mb-2 text-gray-700">{dayLabels[day]}</div>
              <Droppable droppableId={day}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[60px]">
                    {(groups[day] || []).map((it, index) => (
                      <Draggable key={it._key} draggableId={it._key} index={index}>
                        {(prov) => (
                          <Card ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="p-2 bg-white">
                            <div className="text-xs text-gray-500">{it.start_time} - {it.end_time}</div>
                            <div className="text-sm font-medium">{it.subject}</div>
                            {it.topic && <div className="text-xs text-gray-600">{it.topic}</div>}
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      {saving && <div className="text-xs text-gray-500 mt-2">Salvando mudanças...</div>}
    </div>
  );
}