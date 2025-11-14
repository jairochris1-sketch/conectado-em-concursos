
import { useState, useEffect, useCallback } from "react";
import { UserRanking, UserAnswer } from "@/entities/all";
import { User } from "@/entities/User";
import { Trophy } from "lucide-react"; // Only Trophy is used from lucide-react

const calculatePoints = (correct, total) => {
  const accuracy = total > 0 ? correct / total : 0;
  return Math.round(correct * 10 + accuracy * 500 + total * 2);
};

const calculateStreak = (answers) => {
  const dates = [...new Set(answers.map(a => new Date(a.created_date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Normalize current date to start of day
  
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    date.setHours(0, 0, 0, 0); // Normalize answer date to start of day

    // Check if the current date is yesterday (i=0, currentDate - 1 day),
    // or the day before yesterday (i=1, currentDate - 2 days), etc.
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(currentDate.getDate() - i);

    if (date.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const getBadges = (points, correct, total) => {
  const badges = [];
  if (correct >= 100) badges.push("Acertador");
  if (correct >= 500) badges.push("Expert");
  if (total >= 1000) badges.push("Dedicado");
  if (points >= 5000) badges.push("Mestre");
  return badges;
};

export default function RankingPage() {
  const [rankings, setRankings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRankingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, allRankingsResult] = await Promise.all([
        User.me(),
        UserRanking.list("-total_points", 50)
      ]);

      setCurrentUser(user);
      
      let allRankings = allRankingsResult;
      let userRank = allRankings.find(r => r.created_by === user.email);
      
      if (!userRank) {
        // Calcular estatísticas do usuário
        const userAnswers = await UserAnswer.filter({ created_by: user.email });
        const totalQuestions = userAnswers.length;
        const correctAnswers = userAnswers.filter(a => a.is_correct).length;
        const totalPoints = calculatePoints(correctAnswers, totalQuestions);
        
        userRank = await UserRanking.create({
          user_name: user.full_name || "Usuário",
          total_points: totalPoints,
          questions_answered: totalQuestions,
          correct_answers: correctAnswers,
          streak_days: calculateStreak(userAnswers),
          level: Math.floor(totalPoints / 1000) + 1,
          badges: getBadges(totalPoints, correctAnswers, totalQuestions),
          created_by: user.email,
        });
        
        allRankings = [...allRankings, userRank];
      } else {
        // If userRank exists, ensure its data is up-to-date
        const userAnswers = await UserAnswer.filter({ created_by: user.email });
        const totalQuestions = userAnswers.length;
        const correctAnswers = userAnswers.filter(a => a.is_correct).length;
        const newTotalPoints = calculatePoints(correctAnswers, totalQuestions);
        const newStreak = calculateStreak(userAnswers);
        const newLevel = Math.floor(newTotalPoints / 1000) + 1;
        const newBadges = getBadges(newTotalPoints, correctAnswers, totalQuestions);

        // Check if update is needed
        if (userRank.total_points !== newTotalPoints ||
            userRank.questions_answered !== totalQuestions ||
            userRank.correct_answers !== correctAnswers ||
            userRank.streak_days !== newStreak ||
            userRank.level !== newLevel ||
            JSON.stringify(userRank.badges) !== JSON.stringify(newBadges)) {
          
          userRank = await UserRanking.update(userRank.id, {
            user_name: user.full_name || "Usuário",
            total_points: newTotalPoints,
            questions_answered: totalQuestions,
            correct_answers: correctAnswers,
            streak_days: newStreak,
            level: newLevel,
            badges: newBadges,
          });

          // Replace the old userRank in allRankings with the updated one
          allRankings = allRankings.map(r => r.id === userRank.id ? userRank : r);
        }
      }

      setUserRanking(userRank);
      setRankings(allRankings.sort((a, b) => b.total_points - a.total_points));
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 animate-pulse text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  // Find user's position after sorting
  const userPosition = rankings.findIndex(r => r.created_by === currentUser?.email);
  const displayUserPosition = userPosition !== -1 ? userPosition + 1 : null;

  // NEW: split rankings for top 3 and the rest
  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3, 20);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-[#14142a] via-[#161a33] to-[#101226] text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-yellow-900" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Ranking dos Concurseiros</h1>
          </div>
          <p className="text-sm md:text-base text-white/70 mt-2">
            Veja sua posição e compita com outros estudantes
          </p>
        </div>

        {/* Top 3 cards */}
        <div className="space-y-4 mb-6">
          {top3.map((r, idx) => {
            const accuracy = r.questions_answered > 0 ? Math.round((r.correct_answers / r.questions_answered) * 100) : 0;
            const gradients = [
              'from-yellow-400 to-orange-500',
              'from-indigo-400 to-indigo-600',
              'from-amber-600 to-orange-700'
            ];
            return (
              <div
                key={r.id}
                className={`rounded-2xl p-5 shadow-2xl bg-gradient-to-br ${gradients[idx]} text-white flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-bold">{r.user_name}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="opacity-90">Nível {r.level}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-2 bg-white rounded-full" style={{ width: `${accuracy}%` }} />
                        </div>
                        <span className="opacity-90">{accuracy}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold">{r.total_points.toLocaleString()}</div>
                  <div className="text-xs opacity-90">pontos</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Others list */}
        <div className="space-y-3">
          {others.map((r, index) => {
            const position = index + 4;
            const accuracy = r.questions_answered > 0 ? Math.round((r.correct_answers / r.questions_answered) * 100) : 0;
            return (
              <div
                key={r.id}
                className="rounded-2xl px-5 py-4 bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                    {position}
                  </div>
                  <div>
                    <div className="font-semibold">{r.user_name}</div>
                    <div className="flex items-center gap-3 text-xs text-white/80">
                      <span>Nível {r.level}</span>
                      <div className="h-1.5 w-24 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${accuracy}%` }} />
                      </div>
                      <span>{accuracy}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{r.total_points.toLocaleString()}</div>
                  <div className="text-xs text-white/70">pontos</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
