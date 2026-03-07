import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function CycleDonutChart({ plan }) {
  const data = useMemo(() => {
    if (!plan) return [];
    const minutes = (plan.weekly_hours || 0) * 60;
    const items = (plan.subjects_config || []).map((c) => ({
      name: c.subject,
      value: Math.round((c.weight || 0) * minutes),
      color: c.color || "#3b82f6"
    }));
    return items;
  }, [plan]);

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
            {data.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v} min`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2 text-sm text-gray-600">{plan?.weekly_hours || 0}h/semana</div>
    </div>
  );
}