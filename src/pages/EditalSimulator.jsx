import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import EditalDashboard from "../components/edital/EditalDashboard";
import SimulationConfigModal from "../components/edital/SimulationConfigModal";

export default function EditalSimulator() {
  const navigate = useNavigate();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [generatingSimId, setGeneratingSimId] = useState(null);
  const [expandedEditalId, setExpandedEditalId] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedEditalForConfig, setSelectedEditalForConfig] = useState(null);

  // Form state
  const [concursoName, setConcursoName] = useState("");
  const [orgao, setOrgao] = useState("");
  const [cargo, setCargo] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

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
      const edital = editais.find(e => e.id === editalId);
      if (!edital) throw new Error("Edital não encontrado");

      toast.info("Extraindo conteúdo do edital...");
      
      // Buscar o conteúdo do arquivo
      const fileResponse = await fetch(edital.file_url);
      const fileBlob = await fileResponse.blob();
      
      // Atualizar status para processing
      await base44.entities.Edital.update(editalId, { processing_status: 'processing' });
      await loadEditais();

      toast.info("Analisando edital com IA...");
      
      // Processar com LLM
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este edital de concurso público e extraia as seguintes informações em formato JSON:
        
        1. Lista de disciplinas cobradas
        2. Para cada disciplina, liste os principais tópicos e sub-tópicos
        3. Identifique o cargo, banca organizadora (se houver) e nível de escolaridade
        
        Retorne no seguinte formato:
        {
          "disciplinas": [
            {
              "nome": "nome_da_disciplina",
              "topicos": ["topico1", "topico2"],
              "subtopicos": ["subtopico1", "subtopico2"]
            }
          ],
          "cargo": "cargo identificado",
          "banca": "banca organizadora",
          "nivel_escolaridade": "fundamental/medio/superior"
        }`,
        file_urls: [edital.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            disciplinas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  topicos: { type: "array", items: { type: "string" } },
                  subtopicos: { type: "array", items: { type: "string" } }
                }
              }
            },
            cargo: { type: "string" },
            banca: { type: "string" },
            nivel_escolaridade: { type: "string" }
          }
        }
      });

      const totalTopics = analysisResult.disciplinas.reduce((acc, d) => acc + (d.topicos?.length || 0), 0);
      const totalSubtopics = analysisResult.disciplinas.reduce((acc, d) => acc + (d.subtopicos?.length || 0), 0);

      // Buscar questões compatíveis
      const allQuestions = await base44.entities.Question.list('-created_date', 5000);
      const compatibleQuestions = allQuestions.filter(q => 
        analysisResult.disciplinas.some(d => 
          q.subject?.toLowerCase().includes(d.nome.toLowerCase()) ||
          d.nome.toLowerCase().includes(q.subject?.toLowerCase())
        )
      );

      // Atualizar edital com resultados
      await base44.entities.Edital.update(editalId, {
        processing_status: 'completed',
        processed: true,
        subjects_content: analysisResult,
        total_topics: totalTopics,
        total_subtopics: totalSubtopics,
        compatible_questions_count: compatibleQuestions.length,
        cargo: analysisResult.cargo || edital.cargo,
        banca: analysisResult.banca
      });

      toast.success(`Edital processado! ${analysisResult.disciplinas.length} disciplinas, ${totalTopics} tópicos e ${compatibleQuestions.length} questões compatíveis.`);
      await loadEditais();
    } catch (error) {
      console.error("Erro ao processar edital:", error);
      await base44.entities.Edital.update(editalId, { processing_status: 'failed' });
      toast.error("Erro ao processar edital: " + (error.message || "Tente novamente"));
      await loadEditais();
    } finally {
      setProcessingId(null);
    }
  };

  const generateSimulation = async (editalId, questionCount = 20) => {
    setGeneratingSimId(editalId);
    try {
      const edital = editais.find(e => e.id === editalId);
      if (!edital || !edital.subjects_content) {
        toast.error("Edital não processado ainda");
        return;
      }

      const user = await base44.auth.me();
      
      // Buscar todas as questões
      const allQuestions = await base44.entities.Question.list('-created_date', 5000);
      
      // Filtrar questões compatíveis com as disciplinas do edital
      const compatibleQuestions = allQuestions.filter(q => 
        edital.subjects_content.disciplinas.some(d => 
          q.subject?.toLowerCase().includes(d.nome.toLowerCase()) ||
          d.nome.toLowerCase().includes(q.subject?.toLowerCase())
        )
      );

      if (compatibleQuestions.length === 0) {
        toast.error("Nenhuma questão compatível encontrada no banco de dados");
        return;
      }

      // Selecionar questões aleatórias
      const shuffled = compatibleQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, compatibleQuestions.length));

      // Criar simulado
      const simulation = await base44.entities.Simulation.create({
        name: `Simulado - ${edital.concurso_name}`,
        question_count: selectedQuestions.length,
        question_ids: selectedQuestions.map(q => q.id),
        subjects: [...new Set(selectedQuestions.map(q => q.subject))],
        institutions: [...new Set(selectedQuestions.map(q => q.institution))],
        status: 'nao_iniciado',
        edital_based: true,
        edital_id: editalId
      });

      toast.success(`Simulado criado com ${selectedQuestions.length} questões!`);
      navigate(createPageUrl("SolveSimulation") + "?id=" + simulation.id);
    } catch (error) {
      console.error("Erro ao gerar simulado:", error);
      toast.error("Erro ao gerar simulado: " + (error.message || "Tente novamente"));
    } finally {
      setGeneratingSimId(null);
    }
  };

  const generateCustomSimulation = async (disciplineConfig, totalQuestions) => {
    const editalId = selectedEditalForConfig.id;
    setGeneratingSimId(editalId);
    try {
      const edital = editais.find(e => e.id === editalId);
      
      // Buscar todas as questões
      const allQuestions = await base44.entities.Question.list('-created_date', 5000);
      
      const selectedQuestions = [];
      
      // Para cada disciplina na configuração
      for (const [disciplinaNome, quantidade] of Object.entries(disciplineConfig)) {
        if (quantidade > 0) {
          // Filtrar questões dessa disciplina específica
          const disciplinaQuestions = allQuestions.filter(q => 
            q.subject?.toLowerCase().includes(disciplinaNome.toLowerCase()) ||
            disciplinaNome.toLowerCase().includes(q.subject?.toLowerCase())
          );
          
          // Embaralhar e pegar a quantidade solicitada
          const shuffled = disciplinaQuestions.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(quantidade, shuffled.length));
          selectedQuestions.push(...selected);
        }
      }

      if (selectedQuestions.length === 0) {
        toast.error("Nenhuma questão compatível encontrada");
        return;
      }

      // Criar simulado
      const simulation = await base44.entities.Simulation.create({
        name: `Simulado Personalizado - ${edital.concurso_name}`,
        question_count: selectedQuestions.length,
        question_ids: selectedQuestions.map(q => q.id),
        subjects: [...new Set(selectedQuestions.map(q => q.subject))],
        institutions: [...new Set(selectedQuestions.map(q => q.institution))],
        status: 'nao_iniciado',
        edital_based: true,
        edital_id: editalId,
        custom_config: disciplineConfig
      });

      toast.success(`Simulado personalizado criado com ${selectedQuestions.length} questões!`);
      setConfigModalOpen(false);
      navigate(createPageUrl("SolveSimulation") + "?id=" + simulation.id);
    } catch (error) {
      console.error("Erro ao gerar simulado:", error);
      toast.error("Erro ao gerar simulado: " + (error.message || "Tente novamente"));
    } finally {
      setGeneratingSimId(null);
    }
  };

  const openConfigModal = (edital) => {
    setSelectedEditalForConfig(edital);
    setConfigModalOpen(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📄 Simulados Baseados no Edital
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Envie o edital do seu concurso e gere simulados personalizados automaticamente
          </p>
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
                            onClick={() => openConfigModal(edital)}
                            disabled={generatingSimId === edital.id}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Simulado Personalizado
                          </Button>
                          
                          <Button
                            onClick={() => generateSimulation(edital.id, 20)}
                            disabled={generatingSimId === edital.id}
                            variant="outline"
                          >
                            {generatingSimId === edital.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Rápido (20q)
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => generateSimulation(edital.id, 40)}
                            disabled={generatingSimId === edital.id}
                            variant="outline"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Completo (40q)
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

      <SimulationConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        edital={selectedEditalForConfig}
        onGenerateSimulation={generateCustomSimulation}
        isGenerating={generatingSimId === selectedEditalForConfig?.id}
      />
    </div>
  );
}