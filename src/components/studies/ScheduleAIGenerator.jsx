import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, Image as ImageIcon, Printer, Brain, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ScheduleAIGenerator({ course }) {
  // state for form
  const [workHours, setWorkHours] = useState('');
  const [freeTime, setFreeTime] = useState('');
  const [availableDays, setAvailableDays] = useState('');
  const [subjects, setSubjects] = useState(course?.label || '');
  const [hoursPerDay, setHoursPerDay] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  
  const scheduleRef = useRef(null);

  const handleGenerate = async () => {
    if (!availableDays || !subjects || !hoursPerDay) {
      toast.error('Preencha os dias disponíveis, disciplinas e horas por dia para gerar o cronograma.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const prompt = `
      Crie um cronograma de estudos personalizado baseado nas seguintes informações:
      - Curso/Foco: ${course?.label || 'Concurso Geral'}
      - Horário de trabalho: ${workHours || 'Não especificado'}
      - Tempo livre: ${freeTime || 'Não especificado'}
      - Dias disponíveis para estudo: ${availableDays}
      - Disciplinas a estudar: ${subjects}
      - Horas por dia: ${hoursPerDay}
      
      Por favor, retorne os dados no seguinte formato JSON:
      {
        "dias": [
          {
            "dia": "Segunda-feira",
            "atividades": [
              { "horario": "19:00 - 20:00", "disciplina": "Português", "descricao": "Teoria e leitura" },
              { "horario": "20:00 - 21:00", "disciplina": "Matemática", "descricao": "Resolução de exercícios" }
            ]
          }
        ],
        "dicas": ["Dica 1", "Dica 2"]
      }
      Certifique-se de que os horários e atividades sejam realistas baseados nas horas por dia informadas e faça para todos os dias informados.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            dias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string" },
                  atividades: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        horario: { type: "string" },
                        disciplina: { type: "string" },
                        descricao: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            dicas: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      setScheduleData(response);
      toast.success('Cronograma gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar o cronograma. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!scheduleRef.current) return;
    try {
      const canvas = await html2canvas(scheduleRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('cronograma-estudos.pdf');
    } catch (err) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleDownloadPNG = async () => {
    if (!scheduleRef.current) return;
    try {
      const canvas = await html2canvas(scheduleRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = 'cronograma-estudos.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      toast.error('Erro ao gerar imagem');
    }
  };

  const handlePrint = () => {
    const printContent = scheduleRef.current;
    if (!printContent) return;
    
    const windowPrint = window.open('', '', 'width=900,height=650');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Imprimir Cronograma</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
            .schedule-container { max-width: 800px; margin: 0 auto; }
            .day-card { border: 1px solid #ccc; margin-bottom: 15px; border-radius: 8px; padding: 15px; }
            .day-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #4338ca; }
            .activity { display: flex; margin-bottom: 8px; align-items: flex-start; }
            .time { font-weight: bold; width: 120px; }
            .subject { font-weight: bold; color: #1d4ed8; margin-right: 10px; width: 150px; }
            .desc { color: #333; flex: 1; }
            .tips { margin-top: 20px; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; }
            .tips h4 { margin-top: 0; color: #166534; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="schedule-container">
            <h1 style="text-align: center; margin-bottom: 5px;">Plano de Estudos</h1>
            <p style="text-align: center; color: #666; margin-top: 0; margin-bottom: 30px;">${course?.label || 'Concurso'}</p>
            ${scheduleData.dias.map(dia => `
              <div class="day-card">
                <div class="day-title">${dia.dia}</div>
                ${dia.atividades.map(ativ => `
                  <div class="activity">
                    <div class="time">${ativ.horario}</div>
                    <div class="subject">${ativ.disciplina}</div>
                    <div class="desc">${ativ.descricao}</div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
            ${scheduleData.dicas && scheduleData.dicas.length > 0 ? `
              <div class="tips">
                <h4>Dicas de Estudo</h4>
                <ul>
                  ${scheduleData.dicas.map(dica => `<li>${dica}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Brain className="w-5 h-5 text-indigo-600" />
            Gerador de Cronograma com IA
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Preencha seus horários e disponibilidade para que nossa Inteligência Artificial monte o plano perfeito para você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Horário de Trabalho</Label>
              <Input 
                placeholder="Ex: 08:00 às 17:00" 
                value={workHours} 
                onChange={(e) => setWorkHours(e.target.value)} 
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Tempo Livre</Label>
              <Input 
                placeholder="Ex: Noite e finais de semana" 
                value={freeTime} 
                onChange={(e) => setFreeTime(e.target.value)} 
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Dias Disponíveis na Semana</Label>
              <Input 
                placeholder="Ex: Segunda a Sábado" 
                value={availableDays} 
                onChange={(e) => setAvailableDays(e.target.value)} 
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Horas por Dia</Label>
              <Input 
                placeholder="Ex: 3 horas" 
                value={hoursPerDay} 
                onChange={(e) => setHoursPerDay(e.target.value)} 
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-gray-700 dark:text-gray-300">Disciplinas/Matérias</Label>
              <Textarea 
                placeholder="Quais matérias você precisa focar?" 
                value={subjects} 
                onChange={(e) => setSubjects(e.target.value)} 
                rows={3}
                className="bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando seu cronograma mágico...</>
            ) : (
              <><Calendar className="w-4 h-4 mr-2" /> Gerar Cronograma</>
            )}
          </Button>
        </CardContent>
      </Card>

      {scheduleData && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 gap-4">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Seu Cronograma</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Pronto para você começar a estudar.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="dark:border-gray-700 dark:text-gray-300">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPNG} className="dark:border-gray-700 dark:text-gray-300">
                <ImageIcon className="w-4 h-4 mr-2" /> PNG
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="dark:border-gray-700 dark:text-gray-300">
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 overflow-auto">
            <div ref={scheduleRef} className="schedule-container bg-white p-6 md:p-8 rounded-xl min-w-[700px] text-black shadow-sm border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Plano de Estudos Personalizado</h2>
                <p className="text-gray-500 font-medium">{course?.label || 'Concurso'}</p>
              </div>
              
              <div className="space-y-5">
                {scheduleData.dias && scheduleData.dias.map((dia, i) => (
                  <div key={i} className="day-card border border-gray-200 rounded-xl p-5 bg-gray-50/50 shadow-sm">
                    <h3 className="day-title text-lg font-bold text-indigo-700 mb-4 border-b border-indigo-100 pb-2">{dia.dia}</h3>
                    <div className="space-y-4">
                      {dia.atividades && dia.atividades.map((ativ, j) => (
                        <div key={j} className="activity flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5 text-sm">
                          <span className="time bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-md font-semibold whitespace-nowrap min-w-[130px] text-center shadow-sm">
                            {ativ.horario}
                          </span>
                          <span className="subject font-bold text-gray-900 min-w-[160px] pt-1">
                            {ativ.disciplina}
                          </span>
                          <span className="desc text-gray-600 flex-1 pt-1 leading-relaxed">
                            {ativ.descricao}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {scheduleData.dicas && scheduleData.dicas.length > 0 && (
                <div className="tips mt-8 bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
                  <h4 className="text-green-800 font-bold mb-4 flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5" /> Dicas de Estudo
                  </h4>
                  <ul className="list-disc pl-6 space-y-2 text-green-800">
                    {scheduleData.dicas.map((dica, i) => (
                      <li key={i} className="leading-relaxed">{dica}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}