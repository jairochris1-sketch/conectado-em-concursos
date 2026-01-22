import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditalViewer() {
  const navigate = useNavigate();
  const [edital, setEdital] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Erro ao carregar edital:", error);
      toast.error("Erro ao carregar edital");
    } finally {
      setLoading(false);
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
        <div className="max-w-7xl mx-auto flex items-center gap-3">
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
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto p-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full" style={{ height: "calc(100vh - 180px)" }}>
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(edital.file_url)}&embedded=true`}
                className="w-full h-full border-0"
                title={`Edital - ${edital.concurso_name}`}
                allow="fullscreen"
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}