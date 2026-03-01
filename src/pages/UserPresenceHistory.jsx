import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User as UserEntity } from "@/entities/User";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Eye, EyeOff, Circle } from "lucide-react";

const STATUS_COLORS = {
  online: { bg: "bg-green-100", text: "text-green-700", icon: "text-green-600" },
  offline: { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-600" },
  invisible: { bg: "bg-amber-100", text: "text-amber-700", icon: "text-amber-600" }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "online":
      return <Circle className="w-2.5 h-2.5 fill-current" />;
    case "offline":
      return <EyeOff className="w-2.5 h-2.5" />;
    case "invisible":
      return <Eye className="w-2.5 h-2.5" />;
    default:
      return null;
  }
};

const getStatusLabel = (status) => {
  const labels = {
    online: "Online",
    offline: "Offline",
    invisible: "Invisível"
  };
  return labels[status] || status;
};

function PresenceHistoryCard({ presence, user }) {
  const colors = STATUS_COLORS[presence.status] || STATUS_COLORS.offline;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar>
              <AvatarImage src={user?.profile_photo_url} alt={user?.full_name} />
              <AvatarFallback>{user?.full_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{user?.full_name || presence.user_email}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.email || presence.user_email}</p>
            </div>
          </div>
          
          <Badge className={`${colors.bg} ${colors.text} flex items-center gap-1.5 flex-shrink-0`}>
            <span className={colors.icon}>{getStatusIcon(presence.status)}</span>
            {getStatusLabel(presence.status)}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Último visto: {formatDistanceToNow(new Date(presence.last_seen), { locale: ptBR, addSuffix: true })}</span>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {format(new Date(presence.last_seen), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}

export default function UserPresenceHistoryPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnersList, setPartnersList] = useState([]);
  const [presenceData, setPresenceData] = useState({});
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("partners");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar usuário atual
        const user = await UserEntity.me();
        setCurrentUser(user);

        // Carregar parceiros de estudo aceitos
        const acceptedPartners = await base44.entities.StudyPartner.filter({
          status: "accepted"
        });

        const myPartners = acceptedPartners.filter(
          p => p.requester_email === user.email || p.target_email === user.email
        );

        setPartnersList(myPartners);

        // Carregar presença de todos (parceiros + usuário atual)
        const allPresence = await base44.entities.UserPresence.list();
        const presenceMap = {};
        allPresence.forEach(p => {
          presenceMap[p.user_email] = p;
        });
        setPresenceData(presenceMap);

        // Carregar dados dos usuários
        const allUsers = await base44.entities.User.list();
        const usersMap = {};
        allUsers.forEach(u => {
          usersMap[u.email] = u;
        });
        setUsersData(usersMap);

      } catch (error) {
        console.error("Erro ao carregar dados de presença:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscrever para atualizações em tempo real
    const unsubPresence = base44.entities.UserPresence.subscribe((event) => {
      setPresenceData(prev => ({
        ...prev,
        [event.data?.user_email]: event.data
      }));
    });

    return () => unsubPresence();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const partnerEmails = partnersList.map(p => 
    p.requester_email === currentUser?.email ? p.target_email : p.requester_email
  );

  const partnersPresence = partnerEmails
    .map(email => ({
      presence: presenceData[email],
      user: usersData[email],
      email
    }))
    .filter(item => item.presence && item.user)
    .sort((a, b) => new Date(b.presence.last_seen) - new Date(a.presence.last_seen));

  const myPresence = presenceData[currentUser?.email];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Histórico de Presença
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe quando seus parceiros de estudo estiveram ativos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="partners">Parceiros ({partnerEmails.length})</TabsTrigger>
            <TabsTrigger value="me">Minha Presença</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="mt-6">
            {partnersPresence.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    Você ainda não tem parceiros de estudo aceitos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {partnersPresence.map((item) => (
                  <PresenceHistoryCard
                    key={item.email}
                    presence={item.presence}
                    user={item.user}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="me" className="mt-6">
            {myPresence ? (
              <PresenceHistoryCard
                presence={myPresence}
                user={currentUser}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    Seu histórico de presença está sendo carregado
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Circle className="w-2.5 h-2.5 fill-green-600 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Online - Ativo agora</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3 h-3 text-gray-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Offline - Não disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-amber-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Invisível - Oculto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}