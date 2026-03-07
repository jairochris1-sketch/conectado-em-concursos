import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { FileText, UploadCloud, Trash2, List, PlayCircle, Loader2 } from 'lucide-react';

export default function MeuEdital() {
  const [cargos, setCargos] = useState([]);
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [selectedCargoLabel, setSelectedCargoLabel] = useState('');

  const [fileUrl, setFileUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null); // objeto do resumo/verticalização

  const [simLoading, setSimLoading] = useState(false);

  // Carregar cargos cadastrados no sistema
  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.Cargo.list();
        setCargos(items || []);
      } catch (e) {
        console.error('Erro ao carregar cargos', e);
        setCargos([]);
      }
    })();
  }, []);

  // map helpers
  const cargoOptions = useMemo(() => {
    return (cargos || []).map((c) => ({
      id: c.id,
      label: c.label || c.name || c.title || c.value || c.id,
      raw: c,
    }));
  }, [cargos]);

  const onSelectCargo = (id) => {
    setSelectedCargoId(id);
    const found = cargoOptions.find((c) => c.id === id);
    setSelectedCargoLabel(found?.label || '');
  };

  const handleDeleteEdital = () => {
    setFileUrl('');
    setExtracted(null);
  };

  const handleUploadAndExtract = async (file) => {
    if (!file) return;
    setExtracting(true);
    try {
      // 1) Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);

      // 2) Extração estruturada do edital
      const json_schema = {
        type: 'object',
        properties: {
          exam_date: { type: 'string', description: 'Data da prova (ex: 12/10/2026)' },
          exam_times: { type: 'array', items: { type: 'string' }, description: 'Horários de prova' },
          cargos: { type: 'array', items: { type: 'string' }, description: 'Cargos do edital' },
          subjects: { type: 'array', items: { type: 'string' }, description: 'Disciplinas do edital' },
          topics_by_subject: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            description: 'Assuntos por disciplina'
          },
          scoring_by_subject: {
            type: 'object',
            additionalProperties: { type: 'number' },
            description: 'Pontuação por disciplina'
          },
        },
      };

      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema });
      if (res.status === 'success') {
        // output pode ser dict ou array de dicts
        const data = Array.isArray(res.output) ? (res.output[0] || {}) : (res.output || {});
        setExtracted(data);
      } else {
        console.error('Falha na extração:', res.details);
        setExtracted(null);
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerateSimulation = async () => {
    if (!selectedCargoLabel) return;
    setSimLoading(true);
    try {
      // Buscar questões do cargo escolhido (usa campo string "cargo" da entidade Question)
      const questions = await base44.entities.Question.filter({ cargo: selectedCargoLabel }, '-created_date', 200);
      const ids = (questions || []).map((q) => q.id);
      const subjectsSet = new Set((questions || []).map((q) => q.subject).filter(Boolean));

      const sim = await base44.entities.Simulation.create({
        name: `Simulado - ${selectedCargoLabel}`,
        subjects: Array.from(subjectsSet),
        cargos: [selectedCargoLabel],
        question_count: ids.length,
        question_ids: ids,
        status: 'nao_iniciado',
      });

      alert(`Simulado criado com ${ids.length} questões.`);
      // opcional: navegar para Questions (se houver suporte por URL)
      // window.location.assign(createPageUrl('Questions'))
    } catch (e) {
      console.error('Erro ao gerar simulado', e);
      alert('Não foi possível gerar o simulado agora.');
    } finally {
      setSimLoading(false);
    }
  };

  const Verticalizado = ({ data }) => {
    if (!data) return null;
    const { exam_date, exam_times, cargos, subjects, topics_by_subject, scoring_by_subject } = data;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><List className="w-5 h-5" /> Edital Verticalizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exam_date && (
            <div>
              <p className="text-sm text-muted-foreground">Data da prova</p>
              <p className="font-medium">{exam_date}</p>
            </div>
          )}
          {Array.isArray(exam_times) && exam_times.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Horários</p>
              <ul className="list-disc list-inside text-sm">
                {exam_times.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(cargos) && cargos.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Cargos</p>
              <p className="font-medium">{cargos.join(', ')}</p>
            </div>
          )}
          {Array.isArray(subjects) && subjects.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Disciplinas</p>
              <p className="font-medium">{subjects.join(', ')}</p>
            </div>
          )}
          {topics_by_subject && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Assuntos por disciplina</p>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(topics_by_subject).map(([subj, topics]) => (
                  <div key={subj} className="rounded-lg border p-3">
                    <p className="font-medium mb-1">{subj}</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {(topics || []).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          {scoring_by_subject && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pontuação por disciplina</p>
              <div className="grid md:grid-cols-3 gap-3">
                {Object.entries(scoring_by_subject).map(([subj, score]) => (
                  <div key={subj} className="rounded-lg border p-3 flex items-center justify-between">
                    <span className="font-medium">{subj}</span>
                    <span className="text-sm">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const hasSummary = !!extracted;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center gap-2">
          <FileText className="w-7 h-7" />
          <h1 className="text-2xl md:text-3xl font-bold">Meu Edital</h1>
        </header>

        {/* Seletor de Cargo Pretendido */}
        <Card>
          <CardHeader>
            <CardTitle> Cargo Pretendido </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedCargoId} onValueChange={onSelectCargo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargoOptions.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      Nenhum cargo cadastrado
                    </SelectItem>
                  )}
                  {cargoOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCargoLabel && (
                <p className="text-xs text-muted-foreground mt-1">Selecionado: {selectedCargoLabel}</p>
              )}
            </div>

            {/* Upload PDF do Edital */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleUploadAndExtract(e.target.files?.[0])}
                />
                <span className="inline-flex items-center gap-2 text-sm">
                  <UploadCloud className="w-4 h-4" /> Carregar PDF do Edital
                </span>
              </label>
              {extracting && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> extraindo…
                </span>
              )}
              {fileUrl && (
                <Button variant="ghost" size="sm" onClick={handleDeleteEdital} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir edital
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {hasSummary && (
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="verticalizacao">Verticalização</TabsTrigger>
              <TabsTrigger value="simulado">Simulado</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Edital</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extracted.exam_date && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Data da prova</p>
                        <p className="font-medium">{extracted.exam_date}</p>
                      </div>
                      {Array.isArray(extracted.exam_times) && extracted.exam_times.length > 0 && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Horários</p>
                          <p className="font-medium">{extracted.exam_times.join(', ')}</p>
                        </div>
                      )}
                      {Array.isArray(extracted.subjects) && extracted.subjects.length > 0 && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Disciplinas</p>
                          <p className="font-medium">{extracted.subjects.join(', ')}</p>
                        </div>
                      )}
                      {extracted.scoring_by_subject && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Pontuação por disciplina</p>
                          <p className="font-medium">{Object.keys(extracted.scoring_by_subject).length} definidas</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleGenerateSimulation} disabled={!selectedCargoLabel || simLoading}>
                      {simLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                      Gerar Simulado Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verticalizacao">
              <Verticalizado data={extracted} />
            </TabsContent>

            <TabsContent value="simulado">
              <Card>
                <CardHeader>
                  <CardTitle>Simulado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Cargo selecionado: <span className="font-medium">{selectedCargoLabel || '—'}</span>
                  </p>
                  <Button onClick={handleGenerateSimulation} disabled={!selectedCargoLabel || simLoading}>
                    {simLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                    Gerar Simulado Completo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}