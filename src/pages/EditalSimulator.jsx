import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  BookOpen,
  Target,
  Play,
  Trash2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ListChecks,
  Database,
  ClipboardList,
  Settings2
} from "lucide-react";
import { toast } from "sonner";
import EditalDashboard from "../components/edital/EditalDashboard";
import AdvancedSimulationModal from "../components/edital/AdvancedSimulationModal";

export default function EditalSimulator() {
  const navigate = useNavigate();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [generatingSimId, setGeneratingSimId] = useState(null);
  const [expandedEditalId, setExpandedEditalId] = useState(null);

  // Form state
  const [concursoName, setConcursoName] = useState("");
  const [orgao, setOrgao] = useState("");
  const [cargo, setCargo] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [advancedModalEdital, setAdvancedModalEdital] = useState(null);

  useEffect(() => {
    loadEditais();
  }, []);

  const loadEditais = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Edital.filter({ created_by: user.email });
      setEditais(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Erro ao carregar editais:", error);
      toast.error("Erro ao carregar editais");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error("Por favor, envie um arquivo PDF ou DOC");
      return;
    }

    setUploadingFile(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(response.file_url);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitEdital = async (e) => {
    e.preventDefault();
    
    if (!concursoName || !fileUrl) {
      toast.error("Preencha o nome do concurso e envie o edital");
      return;
    }

    setLoading(true);
    try {
      const newEdital = await base44.entities.Edital.create({
        concurso_name: concursoName,
        orgao: orgao,
        cargo: cargo,
        file_url: fileUrl,
        processing_status: 'pending'
      });

      toast.success("Edital cadastrado! Processando...");
      
      // Resetar form
      setConcursoName("");
      setOrgao("");
      setCargo("");
      setFileUrl("");
      
      // Processar o edital
      await processEdital(newEdital.id);
      
      await loadEditais();
    } catch (error) {
      console.error("Erro ao cadastrar edital:", error);
      toast.error("Erro ao cadastrar edital");
    } finally {
      setLoading(false);
    }
  };

  const processEdital = async (editalId) => {
    setProcessingId(editalId);
    try {
      const response = await base44.functions.invoke('processEdital', { edital_id: editalId });
      
      if (response.data.success) {
        toast.success(`Edital processado! ${response.data.total_topics} tópicos identificados, ${response.data.compatible_questions_count} questões compatíveis encontradas.`);
        await loadEditais();
      }
    } catch (error) {
      console.error("Erro ao processar edital:", error);
      toast.error("Erro ao processar edital. Tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const generateSimulation = async (editalId, questionCount = 20) => {
    setGeneratingSimId(editalId);
    try {
      const response = await base44.functions.invoke('generateSimulationFromEdital', {
        edital_id: editalId,
        question_count: questionCount
      });

      if (response.data.success) {
        toast.success(`Simulado criado com ${response.data.questions_count} questões!`);
        navigate(createPageUrl("SolveSimulation") + "?id=" + response.data.simulation_id);
      }
    } catch (error) {
      console.error("Erro ao gerar simulado:", error);
      toast.error(error.response?.data?.error || "Erro ao gerar simulado");
    } finally {
      setGeneratingSimId(null);
    }
  };

  const generateSimulationAdvanced = async ({ discipline_config, total_questions }) => {
    if (!advancedModalEdital) return;
    const editalId = advancedModalEdital.id;
    setGeneratingSimId(editalId);
    try {
      const response = await base44.functions.invoke('generateSimulationFromEdital', {
        edital_id: editalId,
        discipline_config,
        question_count: total_questions
      });

      if (response.data.success) {
        toast.success(`Simulado criado com ${response.data.questions_count} questões!`);
        setAdvancedModalEdital(null);
        navigate(createPageUrl("SolveSimulation") + "?id=" + response.data.simulation_id);
      }
    } catch (error) {
      console.error("Erro ao gerar simulado:", error);
      toast.error(error.response?.data?.error || "Erro ao gerar simulado avançado");
    } finally {
      setGeneratingSimId(null);
    }
  };

  const deleteEdital = async (editalId) => {
    if (!confirm("Tem certeza que deseja excluir este edital?")) return;
    
    try {
      await base44.entities.Edital.delete(editalId);
      toast.success("Edital excluído");
      await loadEditais();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir edital");
    }
  };

  const steps = [
    { icon: Sparkles, label: "Resumo estratégico do edital", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800" },
    { icon: ListChecks, label: "Identifica disciplinas e tópicos", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    { icon: Database, label: "Cruza com banco de questões", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
    { icon: ClipboardList, label: "Gera simulado personalizado", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              📄 Resumo do Edital+Geração de questões+ Verticalização
            </h1>
            <Button variant="outline" onClick={() => navigate(createPageUrl("SimulationHistory"))}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Envie o edital do seu concurso e gere simulados personalizados automaticamente
          </p>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${step.bg} ${step.border}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm`}>
                  <span className="text-xs font-bold text-gray-500">{i + 1}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <step.icon className={`w-4 h-4 flex-shrink-0 ${step.color}`} />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Form */}
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Cadastrar Novo Edital
            </CardTitle>
            <CardDescription>
              Faça upload do edital em PDF ou DOC para análise automática
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitEdital} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="concurso">Nome do Concurso *</Label>
                  <Input
                    id="concurso"
                    placeholder="Ex: Prefeitura de São Paulo"
                    value={concursoName}
                    onChange={(e) => setConcursoName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgao">Órgão</Label>
                  <Input
                    id="orgao"
                    placeholder="Ex: Prefeitura Municipal"
                    value={orgao}
                    onChange={(e) => setOrgao(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cargo">Cargo Pretendido</Label>
                <Input
                  id="cargo"
                  placeholder="Ex: Agente Administrativo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="file">Arquivo do Edital (PDF ou DOC) *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  required
                />
                {uploadingFile && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando arquivo...
                  </p>
                )}
                {fileUrl && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Arquivo enviado com sucesso
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !fileUrl}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Cadastrar e Processar Edital
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Editais */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Meus Editais
          </h2>

          {loading && editais.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : editais.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum edital cadastrado ainda. Comece enviando seu primeiro edital!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {editais.map((edital) => (
                <Card key={edital.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {edital.concurso_name}
                        </h3>
                        {edital.orgao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Órgão: {edital.orgao}
                          </p>
                        )}
                        {edital.cargo && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cargo: {edital.cargo}
                          </p>
                        )}
                      </div>
                      
                      <Badge
                        variant={
                          edital.processing_status === 'completed' ? 'default' :
                          edital.processing_status === 'processing' ? 'secondary' :
                          edital.processing_status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {edital.processing_status === 'completed' ? '✓ Processado' :
                         edital.processing_status === 'processing' ? '⏳ Processando' :
                         edital.processing_status === 'failed' ? '✗ Falhou' : '⏸ Pendente'}
                      </Badge>
                    </div>

                    {edital.processed && edital.subjects_content && (
                      <div className="mb-4">
                        <Button
                          onClick={() => setExpandedEditalId(expandedEditalId === edital.id ? null : edital.id)}
                          variant="outline"
                          className="w-full mb-4"
                        >
                          {expandedEditalId === edital.id ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Ocultar Análise Detalhada
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Ver Análise Detalhada do Edital
                            </>
                          )}
                        </Button>

                        {expandedEditalId === edital.id ? (
                          <EditalDashboard edital={edital} />
                        ) : (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {edital.subjects_content.disciplinas?.length || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Disciplinas</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {edital.total_topics || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Tópicos</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  {edital.total_subtopics || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Sub-tópicos</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                  {edital.compatible_questions_count || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Questões</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {edital.processing_status === 'completed' ? (
                        <>
                          <Button
                            onClick={() => generateSimulation(edital.id, 20)}
                            disabled={generatingSimId === edital.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {generatingSimId === edital.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Gerar (20 q.)
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => generateSimulation(edital.id, 40)}
                            disabled={generatingSimId === edital.id}
                            variant="outline"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            40 q.
                          </Button>

                          <Button
                            onClick={() => setAdvancedModalEdital(edital)}
                            disabled={generatingSimId === edital.id}
                            variant="outline"
                            className="border-purple-400 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-900/20"
                          >
                            <Settings2 className="w-4 h-4 mr-2" />
                            Avançado
                          </Button>
                        </>
                      ) : edital.processing_status === 'pending' || edital.processing_status === 'failed' ? (
                        <Button
                          onClick={() => processEdital(edital.id)}
                          disabled={processingId === edital.id}
                          variant="outline"
                        >
                          {processingId === edital.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {edital.processing_status === 'failed' ? 'Tentar Novamente' : 'Processar Agora'}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button disabled variant="outline">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </Button>
                      )}

                      <Button
                        onClick={() => navigate(createPageUrl("EditalViewer") + "?id=" + edital.id)}
                        variant="outline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Edital
                      </Button>

                      <Button
                        onClick={() => deleteEdital(edital.id)}
                        variant="destructive"
                        size="icon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {edital.processing_status === 'failed' && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-300">
                          Falha no processamento. Verifique se o arquivo é um edital válido e tente novamente.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Simulation Modal */}
      {advancedModalEdital && (
        <AdvancedSimulationModal
          isOpen={!!advancedModalEdital}
          onClose={() => setAdvancedModalEdital(null)}
          edital={advancedModalEdital}
          onGenerate={generateSimulationAdvanced}
          isGenerating={generatingSimId === advancedModalEdital?.id}
        />
      )}
    </div>
  );
}