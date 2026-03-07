import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Play,
  Trash2,
  FileText,
  ClipboardList,
  Clock,
  CheckCircle2,
  PauseCircle,
  Search,
  Target,
  Calendar,
  Hash,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  finalizado: {
    label: "Concluído",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  em_andamento: {
    label: "Em andamento",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Play,
  },
  pausado: {
    label: "Pausado",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: PauseCircle,
  },
  nao_iniciado: {
    label: "Não iniciado",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    icon: Clock,
  },
};

export default function SimulationHistory() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [editaisMap, setEditaisMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();

      const [sims, editais] = await Promise.all([
        base44.entities.Simulation.filter({ created_by: user.email }),
        base44.entities.Edital.filter({ created_by: user.email }),
      ]);

      // Mapear editais pelo id
      const map = {};
      editais.forEach((e) => (map[e.id] = e));
      setEditaisMap(map);

      // Filtrar apenas simulados gerados por edital (que tenham edital_id)
      const editalSims = sims
        .filter((s) => s.edital_id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      setSimulations(editalSims);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico de simulações");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (simId) => {
    if (!confirm("Tem certeza que deseja excluir este simulado?")) return;
    try {
      await base44.entities.Simulation.delete(simId);
      setSimulations((prev) => prev.filter((s) => s.id !== simId));
      toast.success("Simulado excluído");
    } catch (error) {
      toast.error("Erro ao excluir simulado");
    }
  };

  const handleOpen = (sim) => {
    navigate(createPageUrl("SolveSimulation") + "?id=" + sim.id);
  };

  const filtered = simulations.filter((s) => {
    const edital = editaisMap[s.edital_id];
    const term = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      edital?.concurso_name?.toLowerCase().includes(term) ||
      edital?.cargo?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              Histórico de Simulações
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Todos os simulados gerados a partir dos seus editais
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("EditalSimulator"))}
          >
            <Target className="w-4 h-4 mr-2" />
            Gerar novo simulado
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, concurso ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {search ? "Nenhum simulado encontrado" : "Nenhuma simulação gerada ainda"}
            </p>
            {!search && (
              <p className="text-gray-400 text-sm mt-2">
                Acesse{" "}
                <button
                  className="text-blue-500 underline"
                  onClick={() => navigate(createPageUrl("EditalSimulator"))}
                >
                  Simulado por Edital
                </button>{" "}
                para gerar seu primeiro simulado.
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((sim) => {
              const edital = editaisMap[sim.edital_id];
              const status = statusConfig[sim.status] || statusConfig.nao_iniciado;
              const StatusIcon = status.icon;

              return (
                <Card key={sim.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {sim.name || "Simulado sem nome"}
                          </h3>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          {edital && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {edital.concurso_name}
                            </span>
                          )}
                          {edital?.cargo && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {edital.cargo}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5" />
                            {sim.question_count} questões
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(sim.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {sim.status === "finalizado" && sim.score != null && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Pontuação: {sim.score}% ({sim.questions_answered}/{sim.question_count} respondidas)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpen(sim)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          {sim.status === "finalizado" ? "Ver resultado" : "Abrir"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(sim.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}