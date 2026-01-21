import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { UserFollow, ForumPost, ForumReply, UserAnswer } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trophy, BookOpen, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActivityFeedPage() {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const followingList = await UserFollow.filter({ follower_email: userData.email });
      setFollowing(followingList);

      if (followingList.length === 0) {
        setIsLoading(false);
        return;
      }

      const followingEmails = followingList.map(f => f.following_email);

      const [posts, replies, answers] = await Promise.all([
        ForumPost.list("-created_date", 50),
        ForumReply.list("-created_date", 50),
        UserAnswer.list("-created_date", 100)
      ]);

      const allActivities = [
        ...posts.filter(p => followingEmails.includes(p.author_email)).map(p => ({
          type: "post",
          data: p,
          user: followingList.find(f => f.following_email === p.author_email),
          date: p.created_date
        })),
        ...replies.filter(r => followingEmails.includes(r.author_email)).map(r => ({
          type: "reply",
          data: r,
          user: followingList.find(f => f.following_email === r.author_email),
          date: r.created_date
        })),
        ...answers.filter(a => followingEmails.includes(a.created_by)).map(a => ({
          type: "answer",
          data: a,
          user: followingList.find(f => f.following_email === a.created_by),
          date: a.created_date
        }))
      ];

      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivities(allActivities.slice(0, 50));
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" role="status" aria-live="polite" aria-label="Carregando feed de atividades">
        <p>Carregando feed...</p>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Feed de Atividades</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Você ainda não segue ninguém
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece a seguir outros usuários para ver suas atividades aqui
              </p>
              <Link to={createPageUrl("Ranking")}>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ir para o Ranking
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6">
      <a href="#main-feed" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-3 focus:bg-blue-600 focus:text-white focus:rounded">
        Pular para conteúdo principal
      </a>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Feed de Atividades</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Acompanhe as atividades de quem você segue ({following.length} pessoas)
            </p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4" id="main-feed" role="main">
           {activities.map((activity, index) => (
             <Card key={index} role="article" aria-label={`Atividade de ${activity.user?.following_name}`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" aria-label={`Avatar de ${activity.user?.following_name}`}>
                    <AvatarImage src={activity.user?.following_photo_url} alt={`Foto de perfil de ${activity.user?.following_name}`} />
                    <AvatarFallback>{activity.user?.following_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">
                        {activity.user?.following_name}
                      </span>
                      {activity.type === "post" && (
                        <>
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            criou uma discussão
                          </span>
                        </>
                      )}
                      {activity.type === "reply" && (
                        <>
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            respondeu
                          </span>
                        </>
                      )}
                      {activity.type === "answer" && (
                        <>
                          <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-600 flex-shrink-0" aria-hidden="true" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            respondeu <span aria-label={activity.data.is_correct ? "resposta correta" : "resposta incorreta"}>{activity.data.is_correct ? "✓" : "✗"}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {activity.type === "post" && (
                      <Link to={createPageUrl("Community")} className="block">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white hover:text-blue-600 mb-1 break-words">
                          {activity.data.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                          {activity.data.content}
                        </p>
                      </Link>
                    )}

                    {activity.type === "reply" && (
                      <Link to={createPageUrl("Community")} className="block">
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                          {activity.data.content}
                        </p>
                      </Link>
                    )}

                    {activity.type === "answer" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={activity.data.is_correct ? "default" : "destructive"} className="text-xs">
                          {activity.data.is_correct ? "Acertou" : "Errou"}
                        </Badge>
                        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.data.subject}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1 md:mt-2">
                      {new Date(activity.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {activities.length === 0 && (
            <Card role="status" aria-label="Nenhuma atividade encontrada">
              <CardContent className="p-8 md:p-12 text-center">
                <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" aria-hidden="true" />
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Nenhuma atividade recente dos usuários que você segue
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}