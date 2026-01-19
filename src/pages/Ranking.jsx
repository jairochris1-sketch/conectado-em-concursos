import { useState, useEffect, useCallback } from "react";
import { UserRanking, UserAnswer } from "@/entities/all";
import { User } from "@/entities/User";
import { Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "@/components/social/FollowButton";
import { createPageUrl } from "@/utils";

const calculatePoints = (correct, total) => {
  const accuracy = total > 0 ? correct / total : 0;
  return Math.round(correct * 10 + accuracy * 500 + total * 2);
};

const calculateStreak = (answers) => {
  if (!answers || answers.length === 0) return 0;
  
  const uniqueDates = [...new Set(
    answers.map(a => {
      const date = new Date(a.created_date);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  )].sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  // Verificar se tem atividade hoje OU ontem para iniciar o streak
  const mostRecentDate = uniqueDates[0];
  if (mostRecentDate !== todayTime && mostRecentDate !== yesterdayTime) {
    return 0; // Sem atividade recente
  }

  // Contar dias consecutivos
  let checkDate = mostRecentDate === todayTime ? todayTime : yesterdayTime;
  
  for (const dateTime of uniqueDates) {
    if (dateTime === checkDate) {
      streak++;
      checkDate = checkDate - (24 * 60 * 60 * 1000); // Voltar 1 dia
    } else if (dateTime < checkDate) {
      break; // Quebrou a sequência
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
      const user = await User.me();
      setCurrentUser(user);

      // Buscar respostas do usuário
      const userAnswers = await UserAnswer.filter({ created_by: user.email });
      const totalQuestions = userAnswers.length;
      const correctAnswers = userAnswers.filter(a => a.is_correct).length;
      const totalPoints = calculatePoints(correctAnswers, totalQuestions);
      const streakDays = calculateStreak(userAnswers);
      const level = Math.floor(totalPoints / 1000) + 1;
      const badges = getBadges(totalPoints, correctAnswers, totalQuestions);

      // Buscar ou criar ranking do usuário
      let userRank = await UserRanking.filter({ created_by: user.email });
      
      if (userRank.length === 0) {
        // Criar novo registro de ranking
        userRank = await UserRanking.create({
          user_name: user.full_name || "Usuário",
          profile_photo_url: user.profile_photo_url,
          total_points: totalPoints,
          questions_answered: totalQuestions,
          correct_answers: correctAnswers,
          streak_days: streakDays,
          level: level,
          badges: badges
        });
      } else {
        // Atualizar registro existente
        userRank = userRank[0];
        await UserRanking.update(userRank.id, {
          user_name: user.full_name || "Usuário",
          profile_photo_url: user.profile_photo_url,
          total_points: totalPoints,
          questions_answered: totalQuestions,
          correct_answers: correctAnswers,
          streak_days: streakDays,
          level: level,
          badges: badges
        });
        
        // Recarregar dados atualizados
        userRank = {
          ...userRank,
          user_name: user.full_name || "Usuário",
          profile_photo_url: user.profile_photo_url,
          total_points: totalPoints,
          questions_answered: totalQuestions,
          correct_answers: correctAnswers,
          streak_days: streakDays,
          level: level,
          badges: badges
        };
      }

      setUserRanking(userRank);

      // Buscar todos os rankings
      const allRankings = await UserRanking.list("-total_points", 100);
      setRankings(allRankings);
      
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const userData = await User.me();
        if (userData.current_plan !== 'avancado' && userData.email !== 'conectadoemconcursos@gmail.com' && userData.email !== 'jairochris1@gmail.com' && userData.email !== 'juniorgmj2016@gmail.com') {
          window.location.href = createPageUrl('Subscription');
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
      }
    };
    checkAccess();
  }, []);

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

        {/* User's Position Card */}
        {userRanking && displayUserPosition && (
          <div className="mb-6 rounded-2xl p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-xl font-bold">
                  {displayUserPosition}º
                </div>
                <Avatar className="w-12 h-12 border-2 border-white/30">
                  <AvatarImage src={userRanking.profile_photo_url} alt={userRanking.user_name} />
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    {userRanking.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-bold">Sua Posição</div>
                  <div className="text-sm opacity-90">
                    {userRanking.questions_answered} questões • {userRanking.correct_answers} acertos
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-90">Sequência: {userRanking.streak_days} dias 🔥</span>
                    {userRanking.badges?.length > 0 && (
                      <div className="flex gap-1">
                        {userRanking.badges.map((badge, idx) => (
                          <span key={idx} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold">{userRanking.total_points.toLocaleString()}</div>
                <div className="text-xs opacity-90">pontos</div>
                <div className="text-sm mt-1">Nível {userRanking.level}</div>
              </div>
            </div>
          </div>
        )}

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
                  <Avatar className="w-10 h-10 border-2 border-white/20">
                    <AvatarImage src={r.profile_photo_url} alt={r.user_name} />
                    <AvatarFallback className="bg-white/20 text-white font-bold">
                      {r.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
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
                  <FollowButton 
                    targetEmail={r.created_by}
                    targetName={r.user_name}
                    targetPhotoUrl={r.profile_photo_url}
                    size="sm"
                  />
                </div>
                <div className="text-right ml-4">
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
                  <Avatar className="w-8 h-8 border border-white/20">
                    <AvatarImage src={r.profile_photo_url} alt={r.user_name} />
                    <AvatarFallback className="bg-white/10 text-white font-semibold text-sm">
                      {r.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{r.user_name}</div>
                    <div className="flex items-center gap-3 text-xs text-white/80">
                      <span>Nível {r.level}</span>
                      <div className="h-1.5 w-24 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${accuracy}%` }} />
                      </div>
                      <span>{accuracy}%</span>
                    </div>
                  </div>
                  <FollowButton 
                    targetEmail={r.created_by}
                    targetName={r.user_name}
                    targetPhotoUrl={r.profile_photo_url}
                    size="sm"
                  />
                </div>
                <div className="text-right ml-4">
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