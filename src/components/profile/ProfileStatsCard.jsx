import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Target, BookOpen, BarChart2, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const subjectLabels = {
  portugues: "Português", matematica: "Matemática",
  direito_constitucional: "Dir. Constitucional", direito_administrativo: "Dir. Administrativo",
  direito_penal: "Dir. Penal", direito_civil: "Dir. Civil",
  informatica: "Informática", conhecimentos_gerais: "Conhec. Gerais",
  raciocinio_logico: "Raciocínio Lógico", contabilidade: "Contabilidade",
  pedagogia: "Pedagogia"
};

export default function ProfileStatsCard({ user }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserStats.filter({ user_email: user.email })
      .then(res => { if (res.length > 0) setStats(res[0]); })
      .catch(() => {});
  }, [user?.email]);

  const city = user?.city;
  const state = user?.state;
  const targetPosition = user?.target_position || user?.job_title;
  const preferredSubjects = user?.preferred_subjects || [];
  const accuracy = stats?.accuracy_rate ?? null;
  const streak = stats?.streak_days ?? user?.streak_days ?? 0;

  const hasAny = city || targetPosition || preferredSubjects.length > 0 || accuracy !== null || streak > 0;
  if (!hasAny) return null;

  return (
    <Card className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 space-y-3">
        {(city || state) && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>{[city, state].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {targetPosition && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Target className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span><span className="font-medium">Foco:</span> {targetPosition}</span>
          </div>
        )}

        {preferredSubjects.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <BookOpen className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Disciplinas: </span>
              <span>{preferredSubjects.slice(0, 3).map(s => subjectLabels[s] || s).join(", ")}{preferredSubjects.length > 3 ? ` +${preferredSubjects.length - 3}` : ""}</span>
            </div>
          </div>
        )}

        {accuracy !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <BarChart2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span><span className="font-medium">Acertos:</span> {Math.round(accuracy)}%</span>
          </div>
        )}

        {streak > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span><span className="font-medium">Sequência:</span> {streak} {streak === 1 ? "dia" : "dias"} 🔥</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}