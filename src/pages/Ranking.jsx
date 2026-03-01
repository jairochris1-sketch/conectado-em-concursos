import { useState, useEffect, useCallback } from "react";
import { UserRanking } from "@/entities/all";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Trophy, Flame } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "@/components/social/FollowButton";
import { motion } from "framer-motion";

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_GRADIENTS = [
  "from-yellow-400 via-amber-400 to-orange-500",
  "from-slate-300 via-gray-200 to-slate-400",
  "from-amber-700 via-amber-600 to-orange-700",
];
const MEDAL_GLOW = ["shadow-yellow-500/40", "shadow-slate-400/30", "shadow-amber-700/30"];
const MEDAL_BORDER = ["border-yellow-400", "border-slate-300", "border-amber-600"];

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
      await base44.functions.invoke('updateUserStats', { user_email: user.email });
      const userRank = await UserRanking.filter({ created_by: user.email });
      if (userRank.length > 0) setUserRanking(userRank[0]);
      const allRankings = await UserRanking.list("-total_points", 100);
      setRankings(allRankings);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadRankingData(); }, [loadRankingData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#0f172a,#1e1b4b)" }}>
        <div className="text-center text-white">
          <Trophy className="w-14 h-14 animate-pulse text-yellow-400 mx-auto mb-4" />
          <p className="text-lg font-semibold">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const userPosition = rankings.findIndex(r => r.created_by === currentUser?.email);
  const displayUserPosition = userPosition !== -1 ? userPosition + 1 : null;
  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3, 20);
  const podiumOrder = [1, 0, 2];
  const podiumHeights = ["h-24", "h-32", "h-20"];

  return (
    <div className="min-h-screen pb-16 text-white" style={{ background: "linear-gradient(160deg,#0f172a,#1e1b4b 60%,#14142a)" }}>
      <div className="max-w-3xl mx-auto px-4 pt-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-semibold">Ranking Geral</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Ranking dos Concurseiros</h1>
          <p className="text-white/50 mt-1 text-sm">Compita, estude mais e suba no ranking!</p>
        </motion.div>

        {/* Sua Posição */}
        {userRanking && displayUserPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-2xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-600/30 to-teal-700/20 backdrop-blur-sm shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center text-xl font-extrabold text-emerald-300">
                    {displayUserPosition}º
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5">Você</span>
                </div>
                <Avatar className="w-12 h-12 border-2 border-emerald-400/60">
                  <AvatarImage src={userRanking.profile_photo_url} />
                  <AvatarFallback className="bg-emerald-700 text-white font-bold">
                    {userRanking.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-base">{userRanking.user_name}</div>
                  <div className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
                    <span>Nível {userRanking.level}</span>
                    <span>·</span>
                    <span>{userRanking.questions_answered} questões</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" />{userRanking.streak_days}d</span>
                  </div>
                  {userRanking.badges?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {userRanking.badges.map((b, i) => (
                        <span key={i} className="text-[10px] bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-extrabold text-emerald-300">{userRanking.total_points?.toLocaleString()}</div>
                <div className="text-xs text-white/50">pontos</div>
                <div className="text-xs text-white/40 mt-0.5">{userRanking.correct_answers} acertos</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pódio Visual */}
        {top3.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="flex items-end justify-center gap-3 mb-2">
              {podiumOrder.map((rankIdx) => {
                const r = top3[rankIdx];
                if (!r) return null;
                const isCenter = rankIdx === 0;
                const accuracy = r.questions_answered > 0 ? Math.round((r.correct_answers / r.questions_answered) * 100) : 0;
                return (
                  <div key={r.id} className={`flex flex-col items-center ${isCenter ? "scale-105" : ""}`}>
                    <span className="text-3xl mb-1">{MEDALS[rankIdx]}</span>
                    <Avatar className={`border-2 ${MEDAL_BORDER[rankIdx]} shadow-xl ${MEDAL_GLOW[rankIdx]} ${isCenter ? "w-16 h-16" : "w-12 h-12"}`}>
                      <AvatarImage src={r.profile_photo_url} />
                      <AvatarFallback className={`bg-gradient-to-br ${MEDAL_GRADIENTS[rankIdx]} text-white font-bold`}>
                        {r.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`mt-1.5 text-center ${isCenter ? "text-sm" : "text-xs"} font-bold max-w-[90px] truncate`}>{r.user_name}</div>
                    <div className="text-xs text-white/50">{accuracy}% acertos</div>
                    <div className={`${isCenter ? "text-base" : "text-sm"} font-extrabold text-yellow-300`}>{r.total_points?.toLocaleString()}</div>
                    <div className={`w-full mt-2 rounded-t-lg bg-gradient-to-b ${MEDAL_GRADIENTS[rankIdx]} ${podiumHeights[rankIdx]} opacity-30 min-w-[72px]`} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Demais posições */}
        {others.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-3 px-1">Classificação Geral</div>
            {others.map((r, index) => {
              const position = index + 4;
              const accuracy = r.questions_answered > 0 ? Math.round((r.correct_answers / r.questions_answered) * 100) : 0;
              const isMe = r.created_by === currentUser?.email;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`rounded-xl px-4 py-3 flex items-center gap-3 border transition-all ${
                    isMe ? "bg-emerald-500/15 border-emerald-500/40" : "bg-white/5 border-white/8 hover:bg-white/8"
                  }`}
                >
                  <div className="w-7 text-center text-sm font-bold text-white/50">{position}</div>
                  <Avatar className="w-9 h-9 border border-white/20">
                    <AvatarImage src={r.profile_photo_url} />
                    <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                      {r.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${isMe ? "text-emerald-300" : ""}`}>
                      {r.user_name} {isMe && <span className="text-[10px] bg-emerald-500/30 rounded-full px-1.5 py-0.5 ml-1">você</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${accuracy}%` }} />
                      </div>
                      <span className="text-[11px] text-white/50">{accuracy}%</span>
                      <span className="text-[11px] text-white/40 hidden sm:inline">· Nv {r.level}</span>
                      {r.streak_days > 0 && (
                        <span className="text-[11px] text-orange-400 flex items-center gap-0.5">
                          <Flame className="w-3 h-3" />{r.streak_days}
                        </span>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    targetEmail={r.created_by}
                    targetName={r.user_name}
                    targetPhotoUrl={r.profile_photo_url}
                    size="sm"
                  />
                  <div className="text-right min-w-[60px]">
                    <div className="font-bold text-sm">{r.total_points?.toLocaleString()}</div>
                    <div className="text-[10px] text-white/40">pts</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}