import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CycleEditor from "../components/cycle/CycleEditor";
import CycleRunner from "../components/cycle/CycleRunner";
import { Plus, Settings } from "lucide-react";

export default function StudyCycle() {
  const [cycles, setCycles] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [draft, setDraft] = useState(null);
  const current = useMemo(() => cycles.find(c => c.id === currentId) || null, [cycles, currentId]);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.StudyCycle.list("-updated_date", 20);
      setCycles(list);
      if (list.length > 0) setCurrentId(list[0].id);
    })();
  }, []);

  const createNew = async () => {
    const c = await base44.entities.StudyCycle.create({ name: "Meu Ciclo", items: [] });
    const list = await base44.entities.StudyCycle.list("-updated_date", 20);
    setCycles(list);
    setCurrentId(c.id);
  };

  const saveCycle = async (data) => {
    if (!current) return;
    await base44.entities.StudyCycle.update(current.id, { name: data.name, items: data.items });
    const list = await base44.entities.StudyCycle.list("-updated_date", 20);
    setCycles(list);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ciclo de Estudos</h1>
          <div className="flex gap-2">
            <Button onClick={createNew} className="gap-2"><Plus className="w-4 h-4" /> Novo Ciclo</Button>
          </div>
        </div>

        {cycles.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-900/60">
            <CardContent className="p-3 flex flex-wrap gap-2">
              {cycles.map(c => (
                <Button key={c.id} variant={c.id === currentId ? "default" : "outline"} onClick={() => setCurrentId(c.id)} size="sm">
                  {c.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CycleEditor cycle={draft || current} onChange={setDraft} onSave={saveCycle} />
          <CycleRunner cycle={draft || current} />
        </div>
      </div>
    </div>
  );
}