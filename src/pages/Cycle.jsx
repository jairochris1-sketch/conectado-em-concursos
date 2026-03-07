import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import CycleWizard from "../components/cycle/CycleWizard";
import CycleSequenceList from "../components/cycle/CycleSequenceList";
import CycleDonutChart from "../components/cycle/CycleDonutChart";

export default function CyclePage() {
  const [plan, setPlan] = useState(null);
  const [openWizard, setOpenWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.StudyCyclePlan.filter({ is_active: true }, "-created_date", 1);
      setPlan(list?.[0] || null);
      if (!list?.[0]) setOpenWizard(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlan(); }, []);

  const handleRestart = async () => {
    if (!plan) return;
    await base44.entities.StudyCyclePlan.update(plan.id, { progress_minutes: 0, cycles_completed: 0 });
    await loadPlan();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ciclo de Estudos</h1>
          <div className="flex gap-2">
            {plan && (
              <>
                <Button variant="outline" onClick={handleRestart}>Recomeçar Ciclo</Button>
                <Button onClick={() => setOpenWizard(true)}>Editar Planejamento</Button>
              </>
            )}
            {!plan && (
              <Button onClick={() => setOpenWizard(true)} className="gap-2"><PlusCircle className="w-4 h-4"/>Criar Planejamento</Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : plan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>Sequência dos Estudos</CardTitle>
                </CardHeader>
                <CardContent>
                  <CycleSequenceList plan={plan} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>Ciclo</CardTitle>
                </CardHeader>
                <CardContent>
                  <CycleDonutChart plan={plan} />
                </CardContent>
              </Card>
              <Card className="dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">Ciclos completos</div>
                  <div className="text-3xl font-bold">{plan?.cycles_completed || 0}</div>
                  <div className="mt-2 text-sm text-gray-600">Tempo no ciclo atual</div>
                  <div className="text-xl font-semibold">{Math.round((plan?.progress_minutes || 0)/60)}h { (plan?.progress_minutes || 0)%60 }min / {plan?.weekly_hours || 0}h</div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="dark:bg-slate-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-300">Crie seu ciclo para começar a estudar com foco.</p>
              <Button onClick={() => setOpenWizard(true)} className="mt-3">Criar Planejamento</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CycleWizard open={openWizard} onOpenChange={setOpenWizard} initialPlan={plan} onComplete={() => loadPlan()} />
    </div>
  );
}