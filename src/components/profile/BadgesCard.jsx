import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Medal, Trophy, Star, Shield, Flame, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const BADGES_CONFIG = [
  {
    id: "estudante_dedicado",
    name: "Estudante Dedicado",
    description: "Alcançou 10 horas de estudo no total.",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    check: (stats, cycles) => {
      let totalHours = 0;
      cycles.forEach(c => {
        // Horas de ciclos completos
        totalHours += (c.completed_cycles_count || 0) * (c.total_cycle_hours || 0);
        // Horas do ciclo atual
        const currentMins = c.sequence?.reduce((acc, seq) => acc + (seq.completed_minutes || 0), 0) || 0;
        totalHours += currentMins / 60;
      });
      return totalHours >= 10;
    }
  },
  {
    id: "mestre_revisoes",
    name: "Mestre das Revisões",
    description: "Completou pelo menos 5 ciclos de estudo.",
    icon: Award,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    check: (stats, cycles) => {
      const totalCompletedCycles = cycles.reduce((acc, c) => acc + (c.completed_cycles_count || 0), 0);
      return totalCompletedCycles >= 5;
    }
  },
  {
    id: "fogo_focado",
    name: "Foco Implacável",
    description: "Alcançou uma sequência de 7 dias seguidos.",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    check: (stats, cycles) => {
      return (stats?.streak_days || 0) >= 7;
    }
  },
  {
    id: "perito_questoes",
    name: "Perito em Questões",
    description: "Respondeu mais de 100 questões.",
    icon: Target,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    check: (stats, cycles) => {
      return (stats?.total_questions || 0) >= 100;
    }
  },
  {
    id: "precisao_cirurgica",
    name: "Precisão Cirúrgica",
    description: "Alcançou mais de 80% de taxa de acerto.",
    icon: Shield,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    check: (stats, cycles) => {
      return (stats?.total_questions || 0) >= 20 && (stats?.accuracy_rate || 0) >= 80;
    }
  }
];

// Fallback for Target since we missed the import
import { Target } from "lucide-react";

export default function BadgesCard({ user }) {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const loadBadges = async () => {
      try {
        setLoading(true);
        const [statsData, cyclesData] = await Promise.all([
          base44.entities.UserStats.filter({ user_email: user.email }),
          base44.entities.StudyCycle.filter({ user_email: user.email })
        ]);

        const stats = statsData.length > 0 ? statsData[0] : null;
        const cycles = cyclesData || [];

        const earned = BADGES_CONFIG.filter(badge => badge.check(stats, cycles));
        setEarnedBadges(earned);
      } catch (error) {
        console.error("Erro ao carregar conquistas", error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [user?.email]);

  if (loading) {
    return null;
  }

  return (
    <Card className="mt-6 border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Medalhas e Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-sm"
              >
                <div className={`p-3 rounded-full ${badge.bgColor} ${badge.color}`}>
                  <badge.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{badge.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Medal className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">Você ainda não tem medalhas.</p>
            <p className="text-xs mt-1">Continue estudando para desbloquear conquistas!</p>
          </div>
        )}
        
        {/* Next goals placeholder */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
           <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Próximas Metas</h4>
           <div className="flex flex-wrap gap-2">
              {BADGES_CONFIG.filter(b => !earnedBadges.find(eb => eb.id === b.id)).map(badge => (
                <div key={badge.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md opacity-60 grayscale cursor-help" title={badge.description}>
                  <badge.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{badge.name}</span>
                </div>
              ))}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}