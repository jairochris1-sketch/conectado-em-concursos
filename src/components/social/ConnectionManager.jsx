import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCheck, UserX, UserMinus, Shield, Clock, Users, Check, X, Ban
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function ConnectionManager({ user }) {
  const [connections, setConnections] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadConnections();
  }, [open]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const [asTarget, asRequester] = await Promise.all([
        base44.entities.Connection.filter({ target_email: user.email }),
        base44.entities.Connection.filter({ requester_email: user.email }),
      ]);

      setPendingReceived(asTarget.filter(c => c.status === "pending"));
      setBlocked(asTarget.filter(c => c.status === "blocked").concat(asRequester.filter(c => c.status === "blocked" && c.blocked_by === user.email)));
      setConnections(
        asTarget.filter(c => c.status === "accepted").concat(asRequester.filter(c => c.status === "accepted"))
      );
      setPendingSent(asRequester.filter(c => c.status === "pending"));
    } catch (e) {
      toast.error("Erro ao carregar conexões");
    }
    setLoading(false);
  };

  const accept = async (conn) => {
    await base44.entities.Connection.update(conn.id, { status: "accepted" });
    await base44.entities.Notification.create({
      user_email: conn.requester_email,
      title: "Conexão aceita!",
      message: `${user.full_name} aceitou seu pedido de conexão.`,
      type: "follow",
      action_url: createPageUrl("Community"),
      related_user_name: user.full_name,
      related_user_photo: user.profile_photo_url,
    });
    toast.success("Conexão aceita!");
    loadConnections();
  };

  const reject = async (conn) => {
    await base44.entities.Connection.update(conn.id, { status: "rejected" });
    toast.success("Pedido recusado.");
    loadConnections();
  };

  const block = async (conn) => {
    // Determine which user is the other side
    const otherEmail = conn.requester_email === user.email ? conn.target_email : conn.requester_email;
    await base44.entities.Connection.update(conn.id, { status: "blocked", blocked_by: user.email });
    toast.success(`Usuário bloqueado.`);
    loadConnections();
  };

  const unblock = async (conn) => {
    await base44.entities.Connection.delete(conn.id);
    toast.success("Usuário desbloqueado.");
    loadConnections();
  };

  const remove = async (conn) => {
    await base44.entities.Connection.delete(conn.id);
    toast.success("Conexão removida.");
    loadConnections();
  };

  const cancelRequest = async (conn) => {
    await base44.entities.Connection.delete(conn.id);
    toast.success("Pedido cancelado.");
    loadConnections();
  };

  const getOtherUser = (conn) => {
    if (conn.requester_email === user.email) {
      return { name: conn.target_name, photo: conn.target_photo, email: conn.target_email };
    }
    return { name: conn.requester_name, photo: conn.requester_photo, email: conn.requester_email };
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="w-4 h-4 mr-1" />
        Conexões
        {pendingReceived.length > 0 && (
          <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {pendingReceived.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Gerenciar Conexões
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Tabs defaultValue={pendingReceived.length > 0 ? "pending" : "connected"}>
              <TabsList className="w-full">
                <TabsTrigger value="pending" className="flex-1">
                  Pendentes {pendingReceived.length > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5">{pendingReceived.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex-1">Conectados ({connections.length})</TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">Enviados ({pendingSent.length})</TabsTrigger>
                <TabsTrigger value="blocked" className="flex-1">Bloqueados ({blocked.length})</TabsTrigger>
              </TabsList>

              {/* Pedidos recebidos */}
              <TabsContent value="pending">
                <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                  {pendingReceived.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Nenhum pedido pendente</p>
                  ) : pendingReceived.map(conn => {
                    const other = getOtherUser(conn);
                    return (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={other.photo} />
                          <AvatarFallback>{other.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{other.name}</p>
                          <p className="text-xs text-gray-500 truncate">{other.email}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => accept(conn)} className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => reject(conn)} className="h-8 w-8 p-0 text-red-600 border-red-300">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => block(conn)} className="h-8 w-8 p-0 text-gray-500">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Conectados */}
              <TabsContent value="connected">
                <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                  {connections.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Nenhuma conexão ainda</p>
                  ) : connections.map(conn => {
                    const other = getOtherUser(conn);
                    return (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={other.photo} />
                          <AvatarFallback>{other.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{other.name}</p>
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">Conectado</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => remove(conn)} className="h-8 px-2 text-xs text-gray-600">
                            <UserMinus className="w-3 h-3 mr-1" /> Remover
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => block(conn)} className="h-8 w-8 p-0 text-red-500">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Enviados */}
              <TabsContent value="sent">
                <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                  {pendingSent.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Nenhum pedido enviado</p>
                  ) : pendingSent.map(conn => {
                    const other = getOtherUser(conn);
                    return (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={other.photo} />
                          <AvatarFallback>{other.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{other.name}</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs text-yellow-600">Aguardando aceitação</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => cancelRequest(conn)} className="h-8 px-2 text-xs text-red-600 border-red-300">
                          Cancelar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Bloqueados */}
              <TabsContent value="blocked">
                <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                  {blocked.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Nenhum usuário bloqueado</p>
                  ) : blocked.map(conn => {
                    const other = getOtherUser(conn);
                    return (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg border border-red-100">
                        <Avatar className="w-10 h-10 opacity-60">
                          <AvatarImage src={other.photo} />
                          <AvatarFallback>{other.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-gray-500">{other.name}</p>
                          <div className="flex items-center gap-1">
                            <Ban className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-500">Bloqueado</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => unblock(conn)} className="h-8 px-2 text-xs">
                          Desbloquear
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}