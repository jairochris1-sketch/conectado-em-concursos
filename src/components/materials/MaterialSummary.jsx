import React, { useState, useEffect } from 'react';
import { MaterialSummary } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function MaterialSummaryView({ materialId, materialTitle, onGenerateSummary }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (materialId) {
      loadSummary();
    }
  }, [materialId]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const summaries = await MaterialSummary.filter({ material_id: materialId });
      if (summaries.length > 0) {
        setSummary(summaries[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
    setIsLoading(false);
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.functions.invoke('generateMaterialSummary', {
        material_id: materialId,
        material_title: materialTitle
      });

      if (result.success) {
        await loadSummary();
        if (onGenerateSummary) onGenerateSummary();
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      alert('Erro ao gerar resumo');
    }
    setIsGenerating(false);
  };

  const handleDownloadSummary = () => {
    if (!summary || !summary.summary_text) return;

    const content = `
RESUMO: ${materialTitle}
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

${summary.summary_text}

PONTOS PRINCIPAIS:
${(summary.key_points || []).map((point) => `• ${point}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumo-${materialTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Resumo com IA
          </CardTitle>
        </div>
        {!summary || summary.status === 'completed' ? (
          <Button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Gerando...' : summary ? 'Regenerar' : 'Gerar Resumo'}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-gray-500 text-center">Carregando resumo...</p>
        ) : summary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {summary.status === 'pending' || summary.status === 'processing' ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Gerando resumo...</p>
              </div>
            ) : summary.status === 'failed' ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">{summary.error_message || 'Erro ao gerar resumo'}</p>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resumo</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {summary.summary_text}
                  </p>
                </div>

                {summary.key_points && summary.key_points.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pontos Principais</h4>
                    <div className="space-y-1">
                      {summary.key_points.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 flex-shrink-0">{idx + 1}</Badge>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleDownloadSummary}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Resumo
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum resumo gerado ainda</p>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar Resumo com IA'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}