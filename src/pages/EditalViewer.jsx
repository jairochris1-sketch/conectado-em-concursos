import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft, Loader2, Download, Brain, FileText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditalAIAnalysis from "@/components/edital/EditalAIAnalysis";
import { analyzeEdital } from "@/functions/analyzeEdital";

export default function EditalViewer() {
  const navigate = useNavigate();
  const [edital, setEdital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    loadEdital();
  }, []);

  const loadEdital = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const editalId = urlParams.get("id");

    if (!editalId) {
      toast.error("ID do edital não encontrado");
      navigate(createPageUrl("EditalSimulator"));
      return;
    }

    try {
      const data = await base44.entities.Edital.filter({ id: editalId });
      if (data.length === 0) {
        toast.error("Edital não encontrado");
        navigate(createPageUrl("EditalSimulator"));
        return;
      }
      setEdital(data[0]);
      // Carregar análise de IA automaticamente
      loadAIAnalysis(editalId);
    } catch (error) {
      console.error("Erro ao carregar edital:", error);
      toast.error("Erro ao carregar edital");
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async (editalId) => {
    setAnalyzingAI(true);
    try {
      const response = await analyzeEdital({ edital_id: editalId });
      if (response.data?.success) {
        setAiAnalysis(response.data.analysis);
      } else {
        toast.error("Erro ao gerar análise de IA");
      }
    } catch (error) {
      console.error("Erro ao analisar edital com IA:", error);
      toast.error("Não foi possível gerar a análise de IA");
    } finally {
      setAnalyzingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!edital) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              onClick={() => navigate(createPageUrl("EditalSimulator"))}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                {edital.concurso_name}
              </h1>
              {edital.cargo && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {edital.cargo}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = edital.file_url;
                link.download = `${edital.concurso_name}.pdf`;
                link.click();
              }}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Baixar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs: PDF e Análise de IA */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documento do Edital
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Análise por IA
              {analyzingAI && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full" style={{ height: "calc(100vh - 240px)" }}>
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(edital.file_url)}&embedded=true`}
                    className="w-full h-full border-0"
                    title={`Edital - ${edital.concurso_name}`}
                    allow="fullscreen"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            {analyzingAI ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Analisando edital com IA avançada...
                </p>
              </div>
            ) : aiAnalysis ? (
              <EditalAIAnalysis analysis={aiAnalysis} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Não foi possível gerar a análise de IA
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}