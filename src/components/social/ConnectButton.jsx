import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, Ban, X } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

/**
 * ConnectButton - shows connection state between currentUser and targetEmail.
 * States: not_connected, pending_sent, pending_received, connected, blocked
 */
export default function ConnectButton({ currentUser, targetEmail, targetName, targetPhoto, size = "sm", userPlan = 'padrao' }) {
  const [status, setStatus] = useState("loading"); // loading | not_connected | pending_sent | pending_received | connected | blocked
  const [connectionId, setConnectionId] = useState(null);

  useEffect(() => {
    if (!currentUser || !targetEmail || currentUser.email === targetEmail) return;
    loadStatus();
  }, [currentUser?.email, targetEmail]);

  const loadStatus = async () => {
    const [asRequester, asTarget] = await Promise.all([
      base44.entities.Connection.filter({ requester_email: currentUser.email, target_email: targetEmail }),
      base44.entities.Connection.filter({ requester_email: targetEmail, target_email: currentUser.email }),
    ]);

    const all = [...asRequester, ...asTarget];
    if (all.length === 0) { setStatus("not_connected"); setConnectionId(null); return; }

    const conn = all[0];
    setConnectionId(conn.id);

    if (conn.status === "accepted") setStatus("connected");
    else if (conn.status === "blocked") setStatus("blocked");
    else if (conn.status === "pending") {
      if (conn.requester_email === currentUser.email) setStatus("pending_sent");
      else setStatus("pending_received");
    } else {
      setStatus("not_connected");
    }
  };

  const sendRequest = async () => {
    if (userPlan === 'gratuito') {
      toast.error("Usuários do plano gratuito não podem enviar convites de conexão. Faça um upgrade.");
      return;
    }
    
    setStatus("pending_sent");
    try {
      const conn = await base44.entities.Connection.create({
        requester_email: currentUser.email,
        requester_name: currentUser.full_name,
        requester_photo: currentUser.profile_photo_url || "",
        target_email: targetEmail,
        target_name: targetName,
        target_photo: targetPhoto || "",
        status: "pending",
      });
      setConnectionId(conn.id);
      await base44.entities.Notification.create({
        user_email: targetEmail,
        title: "Novo pedido de conexão",
        message: `${currentUser.full_name} quer se conectar com você.`,
        type: "follow",
        action_url: createPageUrl("Profile"),
        related_user_name: currentUser.full_name,
        related_user_photo: currentUser.profile_photo_url,
      });
      toast.success("Pedido de conexão enviado!");
    } catch {
      toast.error("Erro ao enviar pedido");
      setStatus("not_connected");
    }
  };

  const cancelRequest = async () => {
    if (!connectionId) return;
    await base44.entities.Connection.delete(connectionId);
    setStatus("not_connected");
    setConnectionId(null);
    toast.success("Pedido cancelado");
  };

  const accept = async () => {
    if (!connectionId) return;
    await base44.entities.Connection.update(connectionId, { status: "accepted" });
    setStatus("connected");
    toast.success("Conexão aceita!");
  };

  if (!currentUser || currentUser.email === targetEmail) return null;

  if (status === "loading") return null;
  if (status === "blocked") return null;

  if (status === "not_connected") return (
    <Button size={size} onClick={sendRequest} variant="outline" className="gap-1">
      <UserPlus className="w-3 h-3" /> Conectar
    </Button>
  );

  if (status === "pending_sent") return (
    <Button size={size} onClick={cancelRequest} variant="outline" className="gap-1 text-yellow-700 border-yellow-400">
      <Clock className="w-3 h-3" /> Pendente
    </Button>
  );

  if (status === "pending_received") return (
    <Button size={size} onClick={accept} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
      <UserCheck className="w-3 h-3" /> Aceitar
    </Button>
  );

  if (status === "connected") return (
    <Button size={size} variant="outline" className="gap-1 text-green-700 border-green-400 cursor-default" disabled>
      <UserCheck className="w-3 h-3" /> Conectado
    </Button>
  );

  return null;
}