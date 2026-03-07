import React, { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

// Paleta de cores (estática) para mapear matérias de forma determinística
const PALETTE = [
  { bg: 'bg-rose-50', border: 'border-rose-500', dot: 'bg-rose-500' },
  { bg: 'bg-orange-50', border: 'border-orange-500', dot: 'bg-orange-500' },
  { bg: 'bg-amber-50', border: 'border-amber-500', dot: 'bg-amber-500' },
  { bg: 'bg-yellow-50', border: 'border-yellow-500', dot: 'bg-yellow-500' },
  { bg: 'bg-lime-50', border: 'border-lime-600', dot: 'bg-lime-600' },
  { bg: 'bg-green-50', border: 'border-green-600', dot: 'bg-green-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-600', dot: 'bg-emerald-600' },
  { bg: 'bg-teal-50', border: 'border-teal-600', dot: 'bg-teal-600' },
  { bg: 'bg-cyan-50', border: 'border-cyan-600', dot: 'bg-cyan-600' },
  { bg: 'bg-sky-50', border: 'border-sky-600', dot: 'bg-sky-600' },
  { bg: 'bg-blue-50', border: 'border-blue-600', dot: 'bg-blue-600' },
  { bg: 'bg-indigo-50', border: 'border-indigo-600', dot: 'bg-indigo-600' },
  { bg: 'bg-violet-50', border: 'border-violet-600', dot: 'bg-violet-600' },
  { bg: 'bg-purple-50', border: 'border-purple-600', dot: 'bg-purple-600' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-600', dot: 'bg-fuchsia-600' },
  { bg: 'bg-pink-50', border: 'border-pink-600', dot: 'bg-pink-600' },
];

function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPaletteForSubject(subject = '') {
  const idx = hashString(subject) % PALETTE.length;
  return PALETTE[idx];
}

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

  // Keyboard reordering (setas): mover itens sem mouse
  const dayOrder = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const getAdjacentDay = (day, dir) => {
    const idx = dayOrder.indexOf(day);
    if (idx === -1) return day;
    const next = (idx + dir + dayOrder.length) % dayOrder.length;
    return dayOrder[next];
  };

  const moveItemKeyboard = async (fromDay, fromIndex, toDay, toIndex) => {
    const items = [...(schedule?.schedule_items || [])];

    // Listas por dia (antes de remover)
    const listsBefore = dayOrder.map(d => items.filter(i => i.day_of_week === d));
    const sourceItem = listsBefore[dayOrder.indexOf(fromDay)]?.[fromIndex];
    if (!sourceItem) return;

    const removeIdx = items.findIndex(i => i === sourceItem);
    if (removeIdx === -1) return;
    const [moved] = items.splice(removeIdx, 1);
    moved.day_of_week = toDay;

    // Lista do dia alvo após remoção
    const newDayList = items.filter(i => i.day_of_week === toDay);
    const clampedIndex = Math.max(0, Math.min(toIndex, newDayList.length));

    if (clampedIndex >= newDayList.length) {
      let lastIdx = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].day_of_week === toDay) { lastIdx = i; break; }
      }
      const insertAt = lastIdx === -1 ? items.length : lastIdx + 1;
      items.splice(insertAt, 0, moved);
    } else {
      const target = newDayList[clampedIndex];
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

  const onItemKeyDown = (e, day, index) => {
    if (!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "ArrowUp") {
      moveItemKeyboard(day, index, day, Math.max(0, index - 1));
    } else if (e.key === "ArrowDown") {
      moveItemKeyboard(day, index, day, index + 1);
    } else if (e.key === "ArrowLeft") {
      const toDay = getAdjacentDay(day, -1);
      const toIndex = (groups[toDay] || []).length;
      moveItemKeyboard(day, index, toDay, toIndex);
    } else if (e.key === "ArrowRight") {
      const toDay = getAdjacentDay(day, 1);
      const toIndex = (groups[toDay] || []).length;
      moveItemKeyboard(day, index, toDay, toIndex);
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
                    {(groups[day] || []).map((it, index) => {
                      const pal = getPaletteForSubject(it.subject);
                      return (
                        <Draggable key={it._key} draggableId={it._key} index={index}>
                          {(prov) => (
                            <Card
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              tabIndex={0}
                              role="button"
                              aria-label={`Mover ${it.subject} com setas`}
                              onKeyDown={(e) => onItemKeyDown(e, day, index)}
                              className={`p-2 border-l-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${pal.bg} ${pal.border}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block w-2 h-2 rounded-full ${pal.dot}`} />
                                  <div className="text-xs text-gray-600">{it.start_time} - {it.end_time}</div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold mt-1 text-gray-900">{it.subject}</div>
                              {it.topic && <div className="text-xs text-gray-700">{it.topic}</div>}
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
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