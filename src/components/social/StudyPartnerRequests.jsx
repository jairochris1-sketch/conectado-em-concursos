import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { encryptEmail } from "@/components/security/emailCrypto";

export default function StudyPartnerRequests({ currentUser }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!currentUser?.email) return;
    loadRequests();
  }, [currentUser?.email]);

  const loadRequests = async () => {
    const pending = await base44.entities.StudyPartner.filter({
      target_email: currentUser.email,
      status: "pending"
    });
    setRequests(pending);
  };

  const accept = async (record) => {
    setLoading(prev => ({ ...prev, [record.id]: true }));
    await base44.entities.StudyPartner.update(record.id, { status: "accepted" });
    await base44.entities.Notification.create({
      user_email: record.requester_email,
      title: "✅ Parceria aceita!",
      message: `${currentUser.full_name} aceitou seu convite de Parceria de Estudos!`,
      type: "follow",
      action_url: createPageUrl("UserProfile") + `?u=${encryptEmail(currentUser.email)}&openChat=true`,
      related_user_name: currentUser.full_name,
      related_user_photo: currentUser.profile_photo_url || "",
    });
    toast.success(`Parceria com ${record.requester_name} aceita!`);
    setRequests(prev => prev.filter(r => r.id !== record.id));
    setLoading(prev => ({ ...prev, [record.id]: false }));
    navigate(createPageUrl("UserProfile") + `?u=${encryptEmail(record.requester_email)}&openChat=true`);
  };

  const decline = async (record) => {
    setLoading(prev => ({ ...prev, [record.id]: true }));
    await base44.entities.StudyPartner.delete(record.id);
    toast.success("Convite recusado");
    setRequests(prev => prev.filter(r => r.id !== record.id));
    setLoading(prev => ({ ...prev, [record.id]: false }));
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-green-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Solicitações de Parceria de Estudos ({requests.length})
        </h2>
      </div>
      <div className="space-y-3">
        {requests.map(record => (
          <Card key={record.id} className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-green-300">
                  <AvatarImage src={record.requester_photo} />
                  <AvatarFallback className="bg-green-600 text-white font-bold">
                    {record.requester_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{record.requester_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Quer ser seu parceiro(a) de estudos
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => accept(record)}
                    disabled={loading[record.id]}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decline(record)}
                    disabled={loading[record.id]}
                    className="text-red-600 border-red-300 gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Recusar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}