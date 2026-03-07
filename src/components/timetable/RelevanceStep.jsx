import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function RelevanceStep({ subjects = [], config = {}, onChange }) {
  const handle = (subject, field, val) => {
    const v = Array.isArray(val) ? val[0] : val;
    onChange({
      ...config,
      [subject]: { ...(config[subject] || { importance: 3, knowledge: 3 }), [field]: v },
    });
  };

  return (
    <Card className="dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Relevância e Conhecimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <div key={s} className="rounded-lg border p-4 bg-white dark:bg-slate-900">
              <div className="font-medium mb-2">{s}</div>
              <div className="text-xs text-gray-500">IMPORTÂNCIA</div>
              <Slider value={[config[s]?.importance ?? 3]} min={1} max={5} step={1} onValueChange={(v) => handle(s, "importance", v)} />
              <div className="mt-3 text-xs text-gray-500">CONHECIMENTO</div>
              <Slider value={[config[s]?.knowledge ?? 3]} min={1} max={5} step={1} onValueChange={(v) => handle(s, "knowledge", v)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}