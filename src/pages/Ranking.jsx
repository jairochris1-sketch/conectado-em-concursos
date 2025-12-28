
import React, { useState, useEffect, useCallback } from "react";
import { UserRanking, UserAnswer } from "@/entities/all";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";

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
      
      let allRankings = allRankingsResult; // Rename to avoid confusion with parameter
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
          created_by: user.email, // Ensure created_by is set for the new ranking
        });
        
        allRankings = [...allRankings, userRank]; // Add new userRank to the list
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
  }, []); // Empty dependency array as calculatePoints, calculateStreak, getBadges are outside and stable

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  const getRankIcon = (position) => {
    switch(position) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{position}</div>;
    }
  };

  const getBadgeColor = (badge) => {
    const colors = {
      "Acertador": "bg-green-100 text-green-800",
      "Expert": "bg-blue-100 text-blue-800",
      "Dedicado": "bg-purple-100 text-purple-800",
      "Mestre": "bg-yellow-100 text-yellow-800"
    };
    return colors[badge] || "bg-gray-100 text-gray-800";
  };

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


  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🏆 Ranking dos Concurseiros
          </h1>
          <p className="text-gray-600 text-lg">
            Veja sua posição e compete com outros estudantes
          </p>
        </motion.div>

        {/* Card do usuário atual */}
        {userRanking && displayUserPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">Sua Posição</span>
                  <div className="flex items-center gap-2">
                    {getRankIcon(displayUserPosition)}
                    <span className="text-2xl font-bold">#{displayUserPosition}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userRanking.total_points.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Pontos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">Lv. {userRanking.level}</div>
                    <div className="text-sm opacity-90">Nível</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 text-orange-300" />
                      {userRanking.streak_days}
                    </div>
                    <div className="text-sm opacity-90">Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {userRanking.questions_answered > 0 
                        ? `${Math.round((userRanking.correct_answers / userRanking.questions_answered) * 100)}%` 
                        : "0%"}
                    </div>
                    <div className="text-sm opacity-90">Acerto</div>
                  </div>
                </div>
                {userRanking.badges.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm opacity-90 mb-2">Conquistas:</div>
                    <div className="flex flex-wrap gap-2">
                      {userRanking.badges.map((badge, index) => (
                        <Badge key={index} className="bg-white/20 text-white">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ranking geral */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-7 h-7 text-yellow-500" />
              Top Concurseiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rankings.slice(0, 20).map((ranking, index) => (
                <motion.div
                  key={ranking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    ranking.created_by === currentUser?.email 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ranking.user_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Nível {ranking.level}</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {ranking.questions_answered > 0 
                            ? `${Math.round((ranking.correct_answers / ranking.questions_answered) * 100)}% acerto`
                            : "0% acerto"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {ranking.streak_days} dias
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-600">
                      {ranking.total_points.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">pontos</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
