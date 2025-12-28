import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { Question } from '@/entities/Question';

const institutionOptions = ["fcc", "cespe", "vunesp", "fgv", "cesgranrio", "esaf", "idecan", "planejar", "ibptec", "outras"];

export default function QuestionImporter() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [metadata, setMetadata] = useState({
    institution: '',
    year: new Date().getFullYear(),
    exam_name: ''
  });
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResults(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      alert('Por favor, selecione um arquivo PDF válido.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processQuestions = async () => {
    if (!file || !metadata.institution || !metadata.exam_name) {
      alert('Preencha todos os campos obrigatórios e selecione um arquivo.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus('Fazendo upload do arquivo...');

    try {
      // 1. Upload do arquivo
      const { file_url } = await UploadFile({ file });
      setProgress(20);
      setStatus('Processando PDF e extraindo questões...');

      // 2. Usar diretamente o InvokeLLM com o arquivo PDF
      const processedData = await InvokeLLM({
        prompt: `
Você é um especialista em processar questões de concurso. Analise este arquivo PDF e extraia TODAS as questões de forma estruturada.

INSTRUÇÕES CRÍTICAS:
1. IDENTIFIQUE todas as questões numeradas (1, 2, 3... até 1000)
2. Para CADA questão, extraia:
   - Número da questão
   - Enunciado completo (reconstrua se estiver fragmentado)
   - Alternativas (A, B, C, D, E) ou (Certo/Errado)
   - Determine a disciplina (portugues, matematica, direito_constitucional, etc.)
   - Determine o assunto específico
   - Determine o nível: "medio" para técnico, "superior" para analista
   - Identifique cargo se mencionado
3. ENCONTRE o gabarito e associe cada resposta à questão

ATENÇÃO A LAYOUTS DE DUAS COLUNAS:
- O texto pode estar misturado entre colunas
- Reconstitua a ordem correta de leitura
- Junte partes fragmentadas da mesma questão

DISCIPLINAS VÁLIDAS: portugues, matematica, direito_constitucional, direito_administrativo, direito_penal, direito_civil, informatica, conhecimentos_gerais, raciocinio_logico, contabilidade, administracao_publica, economia, estatistica, pedagogia

ASSUNTOS VÁLIDOS: interpretacao_texto, aritmetica, principios_constitucionais, atos_administrativos, etc.
        `,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "number" },
                  statement: { type: "string" },
                  type: { type: "string", enum: ["multiple_choice", "true_false"] },
                  subject: { type: "string" },
                  topic: { type: "string" },
                  education_level: { type: "string", enum: ["medio", "superior"] },
                  cargo: { type: "string" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        letter: { type: "string" },
                        text: { type: "string" }
                      }
                    }
                  },
                  correct_answer: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (!processedData?.questions) {
        throw new Error('Nenhuma questão foi extraída do PDF. Verifique se o arquivo contém questões válidas.');
      }

      const questionsData = processedData.questions;
      setProgress(60);
      setStatus(`Processando ${questionsData.length} questões extraídas...`);

      // 3. Preparar dados para inserção
      const questionsToInsert = questionsData.map(q => ({
        statement: q.statement,
        type: q.type || 'multiple_choice',
        subject: q.subject,
        topic: q.topic || '',
        institution: metadata.institution,
        year: metadata.year,
        exam_name: metadata.exam_name,
        education_level: q.education_level || 'medio',
        cargo: q.cargo || '',
        options: q.options || [],
        correct_answer: q.correct_answer
      })).filter(q => q.statement && q.correct_answer); // Filtrar questões incompletas

      setProgress(75);
      setStatus(`Inserindo ${questionsToInsert.length} questões no banco...`);

      // 4. Inserir em lotes menores
      const batchSize = 25;
      let insertedCount = 0;
      
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);
        await Question.bulkCreate(batch);
        insertedCount += batch.length;
        
        const progressPercent = 75 + ((insertedCount / questionsToInsert.length) * 25);
        setProgress(progressPercent);
        setStatus(`Inseridas ${insertedCount}/${questionsToInsert.length} questões...`);
        
        // Pequena pausa para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(100);
      setStatus('Importação concluída com sucesso!');
      setResults({
        total: insertedCount,
        subjects: [...new Set(questionsToInsert.map(q => q.subject))],
        topics: [...new Set(questionsToInsert.map(q => q.topic).filter(Boolean))],
        cargos: [...new Set(questionsToInsert.map(q => q.cargo).filter(Boolean))],
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      setStatus('Erro: ' + error.message);
      setResults({ error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Importação em Massa de Questões (PDF)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadados da prova */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Banca Organizadora *</Label>
              <Select onValueChange={(value) => setMetadata({...metadata, institution: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a banca..." />
                </SelectTrigger>
                <SelectContent>
                  {institutionOptions.map(inst => (
                    <SelectItem key={inst} value={inst}>{inst.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano da Prova *</Label>
              <Input
                type="number"
                value={metadata.year}
                onChange={(e) => setMetadata({...metadata, year: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome da Prova *</Label>
              <Input
                placeholder="Ex: TRT-SP, INSS, etc."
                value={metadata.exam_name}
                onChange={(e) => setMetadata({...metadata, exam_name: e.target.value})}
              />
            </div>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label>Arquivo PDF com as Questões *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
                id="pdf-upload"
              />
              <Button type="button" variant="outline" className="mb-2" onClick={handleUploadClick}>
                Selecionar PDF
              </Button>
              <p className="text-sm text-gray-600">
                {file ? `Arquivo selecionado: ${file.name}` : 'Selecione um PDF com questões de concurso'}
              </p>
            </div>
          </div>

          {/* Processo de importação */}
          {isProcessing && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{status}</span>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results && !results.error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Importação Concluída!</h3>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>• {results.total} questões importadas</p>
                <p>• {results.subjects.length} disciplinas identificadas</p>
                {results.topics.length > 0 && (
                  <p>• {results.topics.length} assuntos categorizados</p>
                )}
                {results.cargos.length > 0 && (
                  <p>• {results.cargos.length} cargos específicos identificados</p>
                )}
              </div>
            </div>
          )}
          
          {results?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Erro na Importação</h3>
              </div>
              <p className="text-sm text-red-700">{results.error}</p>
            </div>
          )}

          {/* Botão de ação */}
          <Button
            onClick={processQuestions}
            disabled={isProcessing || !file || !metadata.institution || !metadata.exam_name}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando... {Math.round(progress)}%
              </>
            ) : (
              'Iniciar Importação das Questões'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informações em linha contínua */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Como funciona:</p>
              <div className="space-y-1">
                <span>A IA processa diretamente o PDF e extrai todas as questões automaticamente. </span>
                <span>Layout de duas colunas é suportado - o sistema reorganiza o texto. </span>
                <span>Cada questão é categorizada por disciplina, assunto e nível. </span>
                <span>O gabarito é associado automaticamente às questões. </span>
                <span>O processo pode levar alguns minutos, por favor, aguarde.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}