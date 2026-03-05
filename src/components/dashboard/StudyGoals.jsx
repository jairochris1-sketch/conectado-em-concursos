import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { Target, Clock, CheckCircle2, Edit2, X } from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function StudyGoals({ user }) {
  const [goal, setGoal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ weekly_study_hours: 10, weekly_questions: 100 });
  const [progress, setProgress] = useState({ hours: 0, questions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadGoalsAndProgress();
  }, [user]);

  const loadGoalsAndProgress = async () => {
    setIsLoading(true);
    try {
      // 1. Load Goals
      const goals = await base44.entities.UserGoal.filter({ user_email: user.email });
      let currentGoal;
      if (goals.length > 0) {
        currentGoal = goals[0];
      } else {
        currentGoal = await base44.entities.UserGoal.create({
          user_email: user.email,
          weekly_study_hours: 10,
          weekly_questions: 100
        });
      }
      setGoal(currentGoal);
      setFormData({
        weekly_study_hours: currentGoal.weekly_study_hours || 10,
        weekly_questions: currentGoal.weekly_questions || 100
      });

      // 2. Calculate Progress for current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Domingo
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
      
      // Busca as últimas respostas para calcular progresso
      const recentAnswers = await base44.entities.UserAnswer.filter({ created_by: user.email }, "-created_date", 500);
      
      let weekQuestions = 0;
      let weekTimeSpentSeconds = 0;

      recentAnswers.forEach(answer => {
        const answerDate = new Date(answer.created_date);
        if (isWithinInterval(answerDate, { start: weekStart, end: weekEnd })) {
          weekQuestions++;
          weekTimeSpentSeconds += (answer.time_spent || 0);
        }
      });

      setProgress({
        hours: Number((weekTimeSpentSeconds / 3600).toFixed(1)),
        questions: weekQuestions
      });

    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const updated = await base44.entities.UserGoal.update(goal.id, {
        weekly_study_hours: Number(formData.weekly_study_hours),
        weekly_questions: Number(formData.weekly_questions)
      });
      setGoal(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardContent className="p-6 flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  const hoursPercent = Math.min(100, Math.round((progress.hours / goal.weekly_study_hours) * 100)) || 0;
  const questionsPercent = Math.min(100, Math.round((progress.questions / goal.weekly_questions) * 100)) || 0;

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-800">
      <CardHeader className="bg-transparent p-4 md:p-6 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Target className="w-5 h-5 text-blue-600" />
            Minhas Metas Semanais
          </CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-gray-500">
              <Edit2 className="w-4 h-4 mr-1" /> Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-2 space-y-6">
        {isEditing ? (
          <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Meta de Horas por Semana
              </label>
              <Input 
                type="number" 
                value={formData.weekly_study_hours} 
                onChange={(e) => setFormData({...formData, weekly_study_hours: e.target.value})}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Meta de Questões por Semana
              </label>
              <Input 
                type="number" 
                value={formData.weekly_questions} 
                onChange={(e) => setFormData({...formData, weekly_questions: e.target.value})}
                min="1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => {
                setIsEditing(false);
                setFormData({
                  weekly_study_hours: goal.weekly_study_hours,
                  weekly_questions: goal.weekly_questions
                });
              }}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Meta de Horas */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                  <Clock className="w-4 h-4 mr-1.5 text-blue-500" /> Horas de Estudo
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {progress.hours}h / {goal.weekly_study_hours}h
                </span>
              </div>
              <Progress value={hoursPercent} className="h-2.5 bg-gray-100 dark:bg-gray-800" indicatorClassName={hoursPercent >= 100 ? "bg-green-500" : "bg-blue-500"} />
              <p className="text-xs text-right text-gray-500 dark:text-gray-400 font-medium">{hoursPercent}% concluído</p>
            </div>

            {/* Meta de Questões */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Questões Resolvidas
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {progress.questions} / {goal.weekly_questions}
                </span>
              </div>
              <Progress value={questionsPercent} className="h-2.5 bg-gray-100 dark:bg-gray-800" indicatorClassName={questionsPercent >= 100 ? "bg-green-500" : "bg-emerald-500"} />
              <p className="text-xs text-right text-gray-500 dark:text-gray-400 font-medium">{questionsPercent}% concluído</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}