import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Target, TrendingUp, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";

// Mapping to normalize subject names for matching with UserAnswer
const normalizeSubject = (name) => {
  if (!name) return "";
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("portugues")) return "portugues";
  if (normalized.includes("matematica")) return "matematica";
  if (normalized.includes("raciocinio logico")) return "raciocinio_logico";
  if (normalized.includes("informatica")) return "informatica";
  if (normalized.includes("constitucional")) return "direito_constitucional";
  if (normalized.includes("administrativo")) return "direito_administrativo";
  if (normalized.includes("penal")) return "direito_penal";
  if (normalized.includes("civil")) return "direito_civil";
  if (normalized.includes("contabilidade")) return "contabilidade";
  if (normalized.includes("pedagogia")) return "pedagogia";
  if (normalized.includes("8112")) return "lei_8112";
  if (normalized.includes("8666")) return "lei_8666";
  if (normalized.includes("14133")) return "lei_14133";
  if (normalized.includes("constituicao")) return "constituicao_federal";
  if (normalized.includes("gerais") || normalized.includes("atualidades")) return "conhecimentos_gerais";
  return name.toLowerCase().replace(/\s+/g, '_'); // fallback
};

export default function EditalVerticalizado() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [edital, setEdital] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [userAnswers, setUserAnswers] = useState([]);
  
  const urlParams = new URLSearchParams(window.location.search);
  const editalId = urlParams.get('id');

  useEffect(() => {
    if (!editalId) {
      navigate(createPageUrl("EditalSimulator"));
      return;
    }
    loadData();
  }, [editalId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      // Load Edital
      const editais = await base44.entities.Edital.filter({ id: editalId });
      if (editais.length === 0) {
        toast.error("Edital não encontrado.");
        navigate(createPageUrl("EditalSimulator"));
        return;
      }
      const loadedEdital = editais[0];
      setEdital(loadedEdital);

      // Load Progress
      let progData = null;
      const progressRes = await base44.entities.EditalProgress.filter({ 
        user_email: user.email, 
        edital_id: editalId 
      });
      
      if (progressRes.length > 0) {
        progData = progressRes[0];
      } else {
        progData = await base44.entities.EditalProgress.create({
          user_email: user.email,
          edital_id: editalId,
          completed_topics: []
        });
      }
      setProgressData(progData);
      setCompletedTopics(new Set(progData.completed_topics || []));

      // Load User Answers for Performance
      const answers = await base44.entities.UserAnswer.filter({
        user_email: user.email // if your UserAnswer requires filtering by email, though RLS might handle it.
        // Or if it doesn't have user_email explicitly we can just list() which gets current user's answers if RLS is on.
      }).catch(async () => {
        // Fallback: list all answers (assuming RLS protects it)
        return await base44.entities.UserAnswer.list();
      });
      setUserAnswers(answers);

    } catch (error) {
      console.error("Error loading verticalizado data:", error);
      toast.error("Erro ao carregar dados do edital.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (topicId) => {
    if (!progressData) return;
    
    const newCompleted = new Set(completedTopics);
    if (newCompleted.has(topicId)) {
      newCompleted.delete(topicId);
    } else {
      newCompleted.add(topicId);
    }
    setCompletedTopics(newCompleted);

    const completedArray = Array.from(newCompleted);
    
    try {
      await base44.entities.EditalProgress.update(progressData.id, {
        completed_topics: completedArray
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Erro ao salvar progresso.");
      // Revert on error
      if (completedTopics.has(topicId)) newCompleted.add(topicId);
      else newCompleted.delete(topicId);
      setCompletedTopics(newCompleted);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!edital || !edital.subjects_content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Edital ainda não processado</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Aguarde o processamento para visualizar o edital verticalizado.</p>
        <Button onClick={() => navigate(createPageUrl("EditalSimulator"))}>Voltar para Meus Editais</Button>
      </div>
    );
  }

  const disciplinas = edital.subjects_content.disciplinas || [];
  
  // Calculations
  const allTopics = disciplinas.flatMap((d, dIdx) => d.topicos.map((_, tIdx) => `d${dIdx}-t${tIdx}`));
  const totalTopics = allTopics.length;
  const completedCount = completedTopics.size;
  const globalProgress = totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);

  const getDisciplineStats = (disciplina) => {
    const normSubj = normalizeSubject(disciplina.nome);
    const answers = userAnswers.filter(a => normalizeSubject(a.subject) === normSubj || a.subject === normSubj);
    
    const total = answers.length;
    const correct = answers.filter(a => a.is_correct).length;
    const wrong = total - correct;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

    return { total, correct, wrong, accuracy };
  };

  const getDisciplineProgress = (dIdx, topicos) => {
    const dTopics = topicos.map((_, tIdx) => `d${dIdx}-t${tIdx}`);
    const dCompleted = dTopics.filter(t => completedTopics.has(t)).length;
    const progress = dTopics.length === 0 ? 0 : Math.round((dCompleted / dTopics.length) * 100);
    return { completed: dCompleted, total: dTopics.length, progress };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("EditalSimulator"))} className="bg-white dark:bg-gray-800 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Edital Verticalizado</h1>
            <p className="text-gray-600 dark:text-gray-400">{edital.concurso_name} {edital.cargo && `- ${edital.cargo}`}</p>
          </div>
        </div>

        {/* Global Progress */}
        <Card className="border-blue-100 dark:border-blue-900 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Progresso Geral do Edital</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{globalProgress}%</span>
                </div>
                <Progress value={globalProgress} className="h-3" />
                <p className="text-xs text-gray-500">{completedCount} de {totalTopics} tópicos estudados</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-center flex-1 md:w-32">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{disciplinas.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Disciplinas</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl text-center flex-1 md:w-32">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTopics}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tópicos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disciplines Accordion */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            Disciplinas e Tópicos
          </h2>
          
          <Accordion type="multiple" className="space-y-4" defaultValue={disciplinas.length > 0 ? ["item-0"] : []}>
            {disciplinas.map((disciplina, dIdx) => {
              const stats = getDisciplineStats(disciplina);
              const dProgress = getDisciplineProgress(dIdx, disciplina.topicos);
              
              return (
                <AccordionItem key={dIdx} value={`item-${dIdx}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 gap-4">
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{disciplina.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1">{dProgress.completed} de {dProgress.total} tópicos concluídos</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="w-32 hidden md:block">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progresso</span>
                            <span className="font-semibold text-blue-600">{dProgress.progress}%</span>
                          </div>
                          <Progress value={dProgress.progress} className="h-2" />
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                          <div className="text-center px-2 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Resolvidas</p>
                            <p className="font-bold text-gray-900 dark:text-white">{stats.total}</p>
                          </div>
                          <div className="text-center px-2 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Acertos</p>
                            <p className="font-bold text-green-600">{stats.correct}</p>
                          </div>
                          <div className="text-center px-2">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold flex items-center justify-center gap-0.5"><BarChart3 className="w-3 h-3 text-blue-500" /> Desempenho</p>
                            <p className="font-bold text-blue-600">{stats.accuracy}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pt-2 pb-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-3 mt-4 pl-2 md:pl-6">
                      {disciplina.topicos.map((topico, tIdx) => {
                        const topicId = `d${dIdx}-t${tIdx}`;
                        const isChecked = completedTopics.has(topicId);
                        
                        return (
                          <div 
                            key={tIdx} 
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              isChecked 
                                ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30' 
                                : 'bg-white border-gray-100 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                            }`}
                          >
                            <Checkbox 
                              id={topicId} 
                              checked={isChecked}
                              onCheckedChange={() => handleToggleTopic(topicId)}
                              className="mt-1 w-5 h-5 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label 
                              htmlFor={topicId}
                              className={`flex-1 text-sm md:text-base leading-relaxed cursor-pointer transition-colors ${
                                isChecked ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {topico}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </div>
  );
}