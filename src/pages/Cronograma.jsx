import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TimetableWizard from "../components/timetable/Wizard";
import WeeklyView from "../components/timetable/WeeklyView";
import MonthlyView from "../components/timetable/MonthlyView";

export default function CronogramaPage() {
  const [openWizard, setOpenWizard] = useState(false);
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['timetablePlan'],
    queryFn: async () => {
      const list = await base44.entities.StudyTimetablePlan.filter({ is_active: true }, '-created_date', 1);
      return list?.[0] || null;
    },
    initialData: null
  });

  const createMutation = useMutation({
    mutationFn: async (data) => base44.entities.StudyTimetablePlan.create({ ...data, is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetablePlan'] }); setOpenWizard(false); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.StudyTimetablePlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetablePlan'] }); setOpenWizard(false); }
  });

  const handleComplete = (data) => {
    if (plan?.id) updateMutation.mutate({ id: plan.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Cronograma de Estudos</h1>
          <div className="flex gap-2">
            <Button onClick={() => setOpenWizard(true)}>{plan? 'Editar Cronograma' : 'Criar Cronograma'}</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : plan ? (
          <Tabs defaultValue={plan.view_mode || 'weekly'} className="w-full">
            <TabsList>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly"><WeeklyView plan={plan} /></TabsContent>
            <TabsContent value="monthly"><MonthlyView plan={plan} /></TabsContent>
          </Tabs>
        ) : (
          <Card className="dark:bg-slate-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-300">Crie seu cronograma com suas disciplinas e horários.</p>
              <Button className="mt-3" onClick={()=> setOpenWizard(true)}>Criar Cronograma</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TimetableWizard open={openWizard} onOpenChange={setOpenWizard} initialPlan={plan} onComplete={handleComplete} />
    </div>
  );
}