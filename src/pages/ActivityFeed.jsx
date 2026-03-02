import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trophy, BookOpen, UserPlus, Users, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ActivityFeedPage() {
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [watchedCount, setWatchedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const res = await base44.functions.invoke('getFeedActivities');
      if (res.data) {
        setActivities(res.data.activities || []);
        setWatchedCount(res.data.watchedCount || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" role="status" aria-live="polite">
        <p>Carregando feed...</p>
      </div>
    );
  }

  if (watchedCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Feed de Atividades</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Você ainda não segue ninguém nem possui parceiros de estudo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Descubra e conecte-se com outros usuários para ver suas atividades aqui
              </p>
              <Link to={createPageUrl("People")}>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Descobrir Pessoas
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Feed de Atividades</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Acompanhe as atividades da sua rede de estudos
            </p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
           {activities.map((activity) => (
             <Card key={activity.id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <Link to={`${createPageUrl("UserProfile")}?u=${btoa(activity.user_email || '')}`} className="shrink-0">
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 hover:opacity-80 transition-opacity">
                      <AvatarImage src={activity.user_photo} />
                      <AvatarFallback>{activity.user_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <Link to={`${createPageUrl("UserProfile")}?u=${btoa(activity.user_email || '')}`}>
                        <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate hover:underline">
                          {activity.user_name}
                        </span>
                      </Link>
                      
                      {activity.type === "post" && (
                        <>
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            criou uma discussão
                          </span>
                        </>
                      )}
                      {activity.type === "reply" && (
                        <>
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            respondeu em um fórum
                          </span>
                        </>
                      )}
                      {activity.type === "answer" && (
                        <>
                          <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            respondeu <span className={activity.data.is_correct ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{activity.data.is_correct ? "corretamente" : "uma questão"}</span>
                          </span>
                        </>
                      )}
                      {activity.type === "connection" && (
                        <>
                          <LinkIcon className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {activity.data.user_a === activity.user_email ? 'conectou-se com' : 'conectou-se com'} 
                            <span className="font-medium ml-1">
                              {activity.data.user_a === activity.user_email ? activity.data.user_b : activity.data.user_a}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {activity.type === "post" && (
                      <Link to={createPageUrl("Community")} className="block mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white hover:text-blue-600 mb-1 break-words">
                          {activity.data.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                          {activity.data.content}
                        </p>
                      </Link>
                    )}

                    {activity.type === "reply" && (
                      <Link to={createPageUrl("Community")} className="block mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                          {activity.data.content}
                        </p>
                      </Link>
                    )}

                    {activity.type === "answer" && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={activity.data.is_correct ? "default" : "destructive"} className="text-xs">
                          {activity.data.is_correct ? "Acertou" : "Errou"}
                        </Badge>
                        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.data.subject} - {activity.data.institution}
                        </span>
                      </div>
                    )}
                    
                    {activity.type === "connection" && (
                      <div className="mt-2 text-sm text-gray-600">
                        Nova parceria de estudos formada!
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(activity.date).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {activities.length === 0 && (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Nenhuma atividade recente na sua rede
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}