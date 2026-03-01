import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, UserCheck, UserX, Trash2, Search, Shield } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Aceita", color: "bg-green-100 text-green-700" },
  rejected: { label: "Recusada", color: "bg-gray-100 text-gray-600" },
  blocked: { label: "Bloqueada", color: "bg-red-100 text-red-700" },
};

export default function ConnectionsAdmin() {
  const [connections, setConnections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(connections.filter(c =>
      c.requester_email?.toLowerCase().includes(q) ||
      c.target_email?.toLowerCase().includes(q) ||
      c.requester_name?.toLowerCase().includes(q) ||
      c.target_name?.toLowerCase().includes(q)
    ));
  }, [search, connections]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Connection.list("-created_date", 200);
    setConnections(data);
    setFiltered(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Connection.update(id, { status });
    toast.success(`Status atualizado: ${STATUS_LABELS[status]?.label}`);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Remover esta conexão?")) return;
    await base44.entities.Connection.delete(id);
    toast.success("Conexão removida.");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Gerenciar Conexões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por usuário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhuma conexão encontrada.</p>
            )}
            {filtered.map(conn => (
              <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{conn.requester_name || conn.requester_email}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm font-medium">{conn.target_name || conn.target_email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[conn.status]?.color}`}>
                      {STATUS_LABELS[conn.status]?.label}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{conn.requester_email}</span>
                    <span>→</span>
                    <span>{conn.target_email}</span>
                  </div>
                  {conn.blocked_by && (
                    <p className="text-xs text-red-500 mt-0.5">Bloqueado por: {conn.blocked_by}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {conn.status !== "accepted" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(conn.id, "accepted")} className="h-7 px-2 text-xs text-green-700 border-green-300">
                      <UserCheck className="w-3 h-3 mr-1" /> Aceitar
                    </Button>
                  )}
                  {conn.status !== "blocked" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(conn.id, "blocked")} className="h-7 px-2 text-xs text-red-600 border-red-300">
                      <Ban className="w-3 h-3 mr-1" /> Bloquear
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(conn.id)} className="h-7 w-7 p-0 text-gray-500 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}