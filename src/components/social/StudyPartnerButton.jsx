import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  BookOpen, Clock, Check, X, Ban, Users, MessageSquare, UserMinus
} from "lucide-react";

/**
 * StudyPartnerButton
 * Props:
 *   currentUser  - logged-in user object
 *   targetEmail  - email of the profile being viewed
 *   targetName   - display name of the target
 *   targetPhoto  - photo url of the target
 */
export default function StudyPartnerButton({ currentUser, targetEmail, targetName, targetPhoto }) {
  const [status, setStatus] = useState("loading"); // loading | not_connected | pending_sent | pending_received | accepted | blocked
  const [partnerId, setPartnerId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !targetEmail || currentUser.email === targetEmail) return;
    loadStatus();
  }, [currentUser?.email, targetEmail]);

  const loadStatus = async () => {
    const [asSender, asReceiver] = await Promise.all([
      base44.entities.StudyPartner.filter({ requester_email: currentUser.email, target_email: targetEmail }),
      base44.entities.StudyPartner.filter({ requester_email: targetEmail, target_email: currentUser.email }),
    ]);

    const all = [...asSender, ...asReceiver];
    if (all.length === 0) { setStatus("not_connected"); setPartnerId(null); return; }

    const record = all[0];
    setPartnerId(record.id);

    if (record.status === "accepted") setStatus("accepted");
    else if (record.status === "blocked") setStatus("blocked");
    else if (record.status === "pending") {
      setStatus(record.requester_email === currentUser.email ? "pending_sent" : "pending_received");
    } else {
      setStatus("not_connected");
    }
  };

  const notify = async (toEmail, title, message) => {
    await base44.entities.Notification.create({
      user_email: toEmail,
      title,
      message,
      type: "follow",
      action_url: createPageUrl("Community"),
      related_user_name: currentUser.full_name,
      related_user_photo: currentUser.profile_photo_url || "",
    });
  };

  const sendInvite = async () => {
    setLoading(true);
    setStatus("pending_sent");
    const record = await base44.entities.StudyPartner.create({
      requester_email: currentUser.email,
      requester_name: currentUser.full_name,
      requester_photo: currentUser.profile_photo_url || "",
      target_email: targetEmail,
      target_name: targetName,
      target_photo: targetPhoto || "",
      status: "pending",
    });
    setPartnerId(record.id);
    await notify(targetEmail, "📚 Convite de Parceria de Estudos", `${currentUser.full_name} te convidou para ser parceiro(a) de estudos!`);
    toast.success("Convite enviado!");
    setLoading(false);
  };

  const cancelInvite = async () => {
    if (!partnerId) return;
    setLoading(true);
    await base44.entities.StudyPartner.delete(partnerId);
    setStatus("not_connected");
    setPartnerId(null);
    toast.success("Convite cancelado");
    setLoading(false);
  };

  const accept = async () => {
    if (!partnerId) return;
    setLoading(true);
    await base44.entities.StudyPartner.update(partnerId, { status: "accepted" });
    setStatus("accepted");
    await notify(targetEmail, "✅ Parceria aceita!", `${currentUser.full_name} aceitou seu convite de Parceria de Estudos!`);
    toast.success("Parceria aceita!");
    setLoading(false);
  };

  const decline = async () => {
    if (!partnerId) return;
    setLoading(true);
    await base44.entities.StudyPartner.delete(partnerId);
    setStatus("not_connected");
    setPartnerId(null);
    toast.success("Convite recusado");
    setLoading(false);
  };

  const block = async () => {
    if (!confirm("Bloquear este usuário? Ele não poderá te convidar novamente.")) return;
    setLoading(true);
    if (partnerId) {
      await base44.entities.StudyPartner.update(partnerId, { status: "blocked" });
    } else {
      const record = await base44.entities.StudyPartner.create({
        requester_email: currentUser.email,
        requester_name: currentUser.full_name,
        requester_photo: currentUser.profile_photo_url || "",
        target_email: targetEmail,
        target_name: targetName,
        target_photo: targetPhoto || "",
        status: "blocked",
      });
      setPartnerId(record.id);
    }
    setStatus("blocked");
    toast.success("Usuário bloqueado");
    setLoading(false);
  };

  const undoPartnership = async () => {
    if (!confirm("Desfazer parceria de estudos?")) return;
    if (!partnerId) return;
    setLoading(true);
    await base44.entities.StudyPartner.delete(partnerId);
    setStatus("not_connected");
    setPartnerId(null);
    toast.success("Parceria desfeita");
    setLoading(false);
  };

  const openChat = () => {
    window.location.href = createPageUrl("Community");
    toast.info("Abra o chat com seu parceiro pelo Fórum ou Chat.");
  };

  if (!currentUser || currentUser.email === targetEmail) return null;
  if (status === "loading") return null;

  // Bloqueado - não mostra nada (ou apenas botão de desbloquear se quiser)
  if (status === "blocked") return null;

  // Não conectado
  if (status === "not_connected") return (
    <Button size="sm" onClick={sendInvite} disabled={loading} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
      <BookOpen className="w-3.5 h-3.5" /> Convidar para Estudar
    </Button>
  );

  // Convite enviado aguardando resposta
  if (status === "pending_sent") return (
    <div className="flex gap-2 items-center flex-wrap">
      <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-300 px-2.5 py-1.5 rounded-md font-medium">
        <Clock className="w-3.5 h-3.5" /> Solicitação enviada
      </span>
      <Button size="sm" variant="outline" onClick={cancelInvite} disabled={loading} className="gap-1 text-xs text-gray-600">
        <X className="w-3 h-3" /> Cancelar
      </Button>
    </div>
  );

  // Convite recebido
  if (status === "pending_received") return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" onClick={accept} disabled={loading} className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs">
        <Check className="w-3.5 h-3.5" /> Aceitar
      </Button>
      <Button size="sm" onClick={decline} disabled={loading} variant="outline" className="gap-1 text-red-600 border-red-300 text-xs">
        <X className="w-3.5 h-3.5" /> Recusar
      </Button>
      <Button size="sm" onClick={block} disabled={loading} variant="outline" className="gap-1 text-gray-500 text-xs">
        <Ban className="w-3.5 h-3.5" /> Bloquear
      </Button>
    </div>
  );

  // Parceiros de estudo (aceito)
  if (status === "accepted") return (
    <div className="flex gap-2 flex-wrap">
      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-300 px-2.5 py-1.5 rounded-md font-medium">
        <Users className="w-3.5 h-3.5" /> Parceiros de Estudo
      </span>
      <Button size="sm" onClick={openChat} variant="outline" className="gap-1 text-xs text-blue-600 border-blue-300">
        <MessageSquare className="w-3.5 h-3.5" /> Abrir Chat
      </Button>
      <Button size="sm" onClick={undoPartnership} disabled={loading} variant="outline" className="gap-1 text-xs text-red-500 border-red-200">
        <UserMinus className="w-3.5 h-3.5" /> Desfazer
      </Button>
      <Button size="sm" onClick={block} disabled={loading} variant="outline" className="gap-1 text-xs text-gray-500">
        <Ban className="w-3.5 h-3.5" /> Bloquear
      </Button>
    </div>
  );

  return null;
}