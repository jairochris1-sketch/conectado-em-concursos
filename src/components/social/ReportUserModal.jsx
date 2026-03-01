import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Flag } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam / publicidade" },
  { value: "assedio", label: "Assédio ou intimidação" },
  { value: "conteudo_inapropriado", label: "Conteúdo inapropriado" },
  { value: "perfil_falso", label: "Perfil falso" },
  { value: "outro", label: "Outro motivo" },
];

export default function ReportUserModal({ currentUser, reportedEmail, reportedName, open, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Selecione um motivo"); return; }
    setLoading(true);
    await base44.entities.UserReport.create({
      reporter_email: currentUser.email,
      reported_email: reportedEmail,
      reason,
      description: description.trim(),
      status: "pending",
    });
    toast.success("Denúncia enviada. Nossa equipe irá analisar em breve.");
    setReason(""); setDescription("");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Flag className="w-4 h-4" /> Denunciar usuário
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-3">
          Denunciando: <span className="font-semibold">{reportedName}</span>
        </p>
        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-red-500"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>
        <textarea
          placeholder="Descrição adicional (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="flex gap-2 mt-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Enviando..." : "Denunciar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}