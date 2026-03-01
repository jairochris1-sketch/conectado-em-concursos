import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, BookOpen, MapPin, Target, BarChart3, Flame, ArrowLeft, Instagram, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FollowButton from "@/components/social/FollowButton";
import StudyPartnerButton from "@/components/social/StudyPartnerButton";
import StudyPartnerChat from "@/components/chat/StudyPartnerChat";
import { StaffBadge } from "@/components/ui/staff-badge";

const subjectLabels = {
  portugues: "Português", matematica: "Matemática",
  direito_constitucional: "Dir. Constitucional", direito_administrativo: "Dir. Administrativo",
  direito_penal: "Dir. Penal", direito_civil: "Dir. Civil",
  informatica: "Informática", conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico", contabilidade: "Contabilidade", pedagogia: "Pedagogia"
};

import { useLocation } from "react-router-dom";

export default function UserProfilePage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const targetEmail = urlParams.get("email");

  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [partners, setPartners] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [partnershipStatus, setPartnershipStatus] = useState(null);
  const [isPartner, setIsPartner] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!targetEmail) return;
    loadData();
  }, [targetEmail]);

  useEffect(() => {
    if (!isLoading && isPartner && urlParams.get("openChat") === "true") {
      setChatOpen(true);
    }
  }, [isLoading, isPartner, location.search]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const me = await User.me();
      setCurrentUser(me);

      const [stats, ranking, partnersSent, partnersReceived, followList] = await Promise.all([
        base44.entities.UserStats.filter({ user_email: targetEmail }),
        base44.entities.UserRanking.filter({ created_by: targetEmail }),
        base44.entities.StudyPartner.filter({ requester_email: targetEmail, status: "accepted" }),
        base44.entities.StudyPartner.filter({ target_email: targetEmail, status: "accepted" }),
        base44.entities.UserFollow.filter({ following_email: targetEmail }),
      ]);

      // Get profile user via backend function (User entity is restricted by RLS)
      const profileUserResult = await base44.functions.invoke('getUserProfile', { email: targetEmail });
      if (profileUserResult.data) setProfileUser(profileUserResult.data);
      if (stats.length > 0) setUserStats(stats[0]);
      if (ranking.length > 0) setUserRanking(ranking[0]);
      setPartners([...partnersSent, ...partnersReceived]);
      setFollowers(followList);

      // check partnership with current user
      const [asSender, asReceiver] = await Promise.all([
        base44.entities.StudyPartner.filter({ requester_email: me.email, target_email: targetEmail }),
        base44.entities.StudyPartner.filter({ requester_email: targetEmail, target_email: me.email }),
      ]);
      const all = [...asSender, ...asReceiver];
      if (all.length > 0) {
        setPartnershipStatus(all[0].status);
        setIsPartner(all[0].status === "accepted");
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Carregando perfil...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Usuário não encontrado.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === targetEmail;
  // Only accepted partners or own profile can see full stats/details
  const canSeeDetails = isOwnProfile || isPartner;
  const accuracy = userStats ? Math.round((userStats.correct_answers / Math.max(1, userStats.total_answers)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        {/* Header do perfil */}
        <Card className="mb-5">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                <AvatarImage src={profileUser.profile_photo_url} />
                <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                  {profileUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileUser.full_name}</h1>
                  <StaffBadge email={profileUser.email} className="w-5 h-5" />
                </div>
                {(profileUser.city || profileUser.state) && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[profileUser.city, profileUser.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {profileUser.profession && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profileUser.profession}</p>
                )}

                {/* Redes Sociais */}
                {(profileUser.instagram_url || profileUser.linkedin_url || profileUser.portfolio_url) && (
                  <div className="flex items-center gap-3 mt-3">
                    {profileUser.instagram_url && (
                      <a href={profileUser.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 transition-colors">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {profileUser.linkedin_url && (
                      <a href={profileUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {profileUser.portfolio_url && (
                      <a href={profileUser.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                {!isOwnProfile && currentUser && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <FollowButton
                      targetEmail={targetEmail}
                      targetName={profileUser.full_name}
                      targetPhotoUrl={profileUser.profile_photo_url}
                    />
                    <StudyPartnerButton
                      currentUser={currentUser}
                      targetEmail={targetEmail}
                      targetName={profileUser.full_name}
                      targetPhoto={profileUser.profile_photo_url}
                    />
                  </div>
                )}
                {isOwnProfile && (
                  <Link to={createPageUrl("Profile")}>
                    <Button size="sm" variant="outline" className="mt-3">Editar Perfil</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{followers.length}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Seguidores
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{partners.length}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" /> Parceiros
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {canSeeDetails ? (userStats?.streak_days || 0) : "🔒"}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Sequência
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Not a partner notice */}
        {!isOwnProfile && !isPartner && (
          <Card className="mb-5 border-dashed border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4 text-center text-sm text-yellow-700 dark:text-yellow-300">
              🔒 Aceite o convite de parceria para ver o perfil completo e trocar mensagens.
            </CardContent>
          </Card>
        )}

        {/* Desempenho - only for partners/self */}
        {canSeeDetails && userStats && (
          <Card className="mb-5">
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Desempenho
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Questões respondidas</div>
                  <div className="text-xl font-bold">{userStats.total_answers || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Taxa de acertos</div>
                  <div className="text-xl font-bold text-green-600">{accuracy}%</div>
                </div>
                {userRanking && (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pontuação total</div>
                      <div className="text-xl font-bold text-yellow-600">{userRanking.total_points?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Nível</div>
                      <div className="text-xl font-bold">{userRanking.level}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cargo pretendido - only for partners/self */}
        {canSeeDetails && profileUser.target_position && (
          <Card className="mb-5">
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> Cargo Pretendido
              </h2>
              <Badge variant="secondary" className="text-sm">{profileUser.target_position}</Badge>
            </CardContent>
          </Card>
        )}

        {/* Disciplinas preferidas - only for partners/self */}
        {canSeeDetails && profileUser.preferred_subjects?.length > 0 && (
          <Card className="mb-5">
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">📚 Disciplinas Preferidas</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.preferred_subjects.map(s => (
                  <Badge key={s} variant="outline">{subjectLabels[s] || s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat */}
      {chatOpen && currentUser && (
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="p-0 max-w-md h-[600px] flex flex-col overflow-hidden">
            <StudyPartnerChat
              currentUser={currentUser}
              partner={{ email: targetEmail, name: profileUser.full_name, photo: profileUser.profile_photo_url }}
              onClose={() => setChatOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}