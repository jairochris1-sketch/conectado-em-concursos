import React from "react";

export default function CycleSequenceList({ plan }) {
  const seq = plan?.sequence || [];
  return (
    <div className="space-y-2">
      {seq.map((s, idx) => (
        <div key={idx} className="flex items-center justify-between rounded-lg border p-2 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded" style={{backgroundColor: plan?.subjects_config?.find(c=>c.subject===s.subject)?.color || '#3b82f6'}} />
            <div className="font-medium text-sm">{s.subject}</div>
          </div>
          <div className="text-sm text-gray-600">{s.duration_minutes} min</div>
        </div>
      ))}
      {seq.length === 0 && (
        <div className="text-sm text-gray-500">Nenhuma sessão gerada ainda.</div>
      )}
    </div>
  );
}