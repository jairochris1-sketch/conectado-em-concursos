import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { BookOpen, Clock, Check, X, Ban, Users, MessageSquare, UserMinus, Flag } from "lucide-react";
import StudyPartnerChat from "@/components/chat/StudyPartnerChat";
import ReportUserModal from "@/components/social/ReportUserModal";
import { studyPartnerSecurity } from "@/functions/studyPartnerSecurity";

export default function StudyPartnerButton({ currentUser, targetEmail, targetName, targetPhoto }) {
  const [status, setStatus] = useState("loading");
  const [partnerId, setPartnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
    else if (record.status === "pending")
      setStatus(record.requester_email === currentUser.email ? "pending_sent" : "pending_received");
    else setStatus("not_connected");
  };

  const notify = async (toEmail, title, message) => {
    await base44.entities.Notification.create({
      user_email: toEmail, title, message, type: "follow",
      action_url: createPageUrl("Community"),
      related_user_name: currentUser.full_name,
      related_user_photo: currentUser.profile_photo_url || "",
    });
  };

  const sendInvite = async () => {
    setLoading(true);
    // Security check
    const res = await studyPartnerSecurity({ action: "check_invite", targetEmail });
    if (!res.data?.allowed) {
      toast.error(res.data?.reason || "Não foi possível enviar o convite.");
      setLoading(false);
      return;
    }
    setStatus("pending_sent");
    const record = await base44.entities.StudyPartner.create({
      requester_email: currentUser.email, requester_name: currentUser.full_name,
      requester_photo: currentUser.profile_photo_url || "",
      target_email: targetEmail, target_name: targetName, target_photo: targetPhoto || "",
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
    setStatus("not_connected"); setPartnerId(null);
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
    setStatus("not_connected"); setPartnerId(null);
    toast.success("Convite recusado");
    setLoading(false);
  };

  const block = async () => {
    if (!confirm("Bloquear este usuário?")) return;
    setLoading(true);
    if (partnerId) {
      await base44.entities.StudyPartner.update(partnerId, { status: "blocked" });
    } else {
      const record = await base44.entities.StudyPartner.create({
        requester_email: currentUser.email, requester_name: currentUser.full_name,
        requester_photo: currentUser.profile_photo_url || "",
        target_email: targetEmail, target_name: targetName, target_photo: targetPhoto || "",
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
    setStatus("not_connected"); setPartnerId(null);
    toast.success("Parceria desfeita");
    setLoading(false);
  };

  if (!currentUser || currentUser.email === targetEmail) return null;
  if (status === "loading") return null;
  if (status === "blocked") return null;

  const partner = { email: targetEmail, name: targetName, photo: targetPhoto };

  return (
    <>
      <div className="flex gap-2 flex-wrap items-center">
        {status === "not_connected" && (
          <Button size="sm" onClick={sendInvite} disabled={loading} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            <BookOpen className="w-3.5 h-3.5" /> Convidar para Estudar
          </Button>
        )}

        {status === "pending_sent" && (
          <>
            <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-300 px-2.5 py-1.5 rounded-md font-medium">
              <Clock className="w-3.5 h-3.5" /> Solicitação enviada
            </span>
            <Button size="sm" variant="outline" onClick={cancelInvite} disabled={loading} className="gap-1 text-xs text-gray-600">
              <X className="w-3 h-3" /> Cancelar
            </Button>
          </>
        )}

        {status === "pending_received" && (
          <>
            <Button size="sm" onClick={accept} disabled={loading} className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs">
              <Check className="w-3.5 h-3.5" /> Aceitar
            </Button>
            <Button size="sm" onClick={decline} disabled={loading} variant="outline" className="gap-1 text-red-600 border-red-300 text-xs">
              <X className="w-3.5 h-3.5" /> Recusar
            </Button>
            <Button size="sm" onClick={block} disabled={loading} variant="outline" className="gap-1 text-gray-500 text-xs">
              <Ban className="w-3.5 h-3.5" /> Bloquear
            </Button>
          </>
        )}

        {status === "accepted" && (
          <>
            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-300 px-2.5 py-1.5 rounded-md font-medium">
              <Users className="w-3.5 h-3.5" /> Parceiros de Estudo
            </span>
            <Button size="sm" onClick={() => setChatOpen(true)} variant="outline" className="gap-1 text-xs text-blue-600 border-blue-300">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </Button>
            <Button size="sm" onClick={undoPartnership} disabled={loading} variant="outline" className="gap-1 text-xs text-red-500 border-red-200">
              <UserMinus className="w-3.5 h-3.5" /> Desfazer
            </Button>
            <Button size="sm" onClick={block} disabled={loading} variant="outline" className="gap-1 text-xs text-gray-500">
              <Ban className="w-3.5 h-3.5" /> Bloquear
            </Button>
          </>
        )}

        {/* Report button always visible (except self) */}
        <Button size="sm" variant="ghost" onClick={() => setReportOpen(true)} className="gap-1 text-xs text-red-400 hover:text-red-600">
          <Flag className="w-3 h-3" /> Denunciar
        </Button>
      </div>

      {/* Chat Dialog */}
      {status === "accepted" && (
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="p-0 max-w-md h-[600px] flex flex-col overflow-hidden">
            <StudyPartnerChat
              currentUser={currentUser}
              partner={partner}
              onClose={() => setChatOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Report Modal */}
      <ReportUserModal
        currentUser={currentUser}
        reportedEmail={targetEmail}
        reportedName={targetName}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}