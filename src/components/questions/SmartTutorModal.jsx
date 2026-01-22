import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  ArrowRight,
  Save,
  CheckCircle2,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function SmartTutorModal({ 
  isOpen, 
  onClose, 
  question, 
  userAnswer, 
  correctAnswer 
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [userNotes, setUserNotes] = useState("");
  const [doubtStatus, setDoubtStatus] = useState(null); // null, 'saved', 'resolved'
  const [studyInsights, setStudyInsights] = useState(null);

  React.useEffect(() => {
    if (isOpen && question) {
      if (!analysis) {
        analyzeError();
      }
      loadUserStudyInsights();
      checkExistingDoubt();
    }
  }, [isOpen, question]);

  const analyzeError = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeQuestionError', {
        question_id: question.id,
        user_answer: userAnswer
      });

      setAnalysis(response.data);
    } catch (error) {
      console.error("Erro ao analisar:", error);
      toast.error("Erro ao obter ajuda da IA");
    } finally {
      setLoading(false);
    }
  };

  const loadUserStudyInsights = async () => {
    try {
      const response = await base44.functions.invoke('getUserStudyInsights', {});
      setStudyInsights(response.data);
    } catch (error) {
      console.error("Erro ao carregar insights:", error);
    }
  };

  const checkExistingDoubt = async () => {
    try {
      const user = await base44.auth.me();
      const existingDoubts = await base44.entities.QuestionDoubt.filter({
        question_id: question.id,
        created_by: user.email
      });
      if (existingDoubts.length > 0) {
        const doubt = existingDoubts[0];
        setUserNotes(doubt.notes || '');
        setDoubtStatus(doubt.status === 'resolvida' ? 'resolved' : 'saved');
      }
    } catch (error) {
      console.error("Erro ao verificar dúvida:", error);
    }
  };

  const handleSaveDoubt = async () => {
    try {
      // Buscar dúvida existente
      const existingDoubts = await base44.entities.QuestionDoubt.filter({
        question_id: question.id,
        created_by: (await base44.auth.me()).email
      });

      if (existingDoubts.length > 0) {
        // Atualizar
        await base44.entities.QuestionDoubt.update(existingDoubts[0].id, {
          notes: userNotes,
          status: 'pendente'
        });
      } else {
        // Criar nova
        await base44.entities.QuestionDoubt.create({
          question_id: question.id,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          ai_explanation: analysis?.explanation || '',
          subject: question.subject,
          topic: question.topic,
          notes: userNotes,
          status: 'pendente'
        });
      }

      setDoubtStatus('saved');
      toast.success("Dúvida salva para revisão!");
    } catch (error) {
      console.error("Erro ao salvar dúvida:", error);
      toast.error("Erro ao salvar dúvida");
    }
  };

  const handleMarkAsResolved = async () => {
    try {
      const user = await base44.auth.me();
      const existingDoubts = await base44.entities.QuestionDoubt.filter({
        question_id: question.id,
        created_by: user.email
      });

      if (existingDoubts.length > 0) {
        await base44.entities.QuestionDoubt.update(existingDoubts[0].id, {
          status: 'resolvida',
          notes: userNotes
        });
        setDoubtStatus('resolved');
        toast.success("Dúvida marcada como resolvida!");
      } else {
        await base44.entities.QuestionDoubt.create({
          question_id: question.id,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          ai_explanation: analysis?.explanation || '',
          subject: question.subject,
          topic: question.topic,
          notes: userNotes,
          status: 'resolvida'
        });
        setDoubtStatus('resolved');
        toast.success("Dúvida marcada como resolvida!");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleMarkAsPending = async () => {
    try {
      const user = await base44.auth.me();
      const existingDoubts = await base44.entities.QuestionDoubt.filter({
        question_id: question.id,
        created_by: user.email
      });

      if (existingDoubts.length > 0) {
        await base44.entities.QuestionDoubt.update(existingDoubts[0].id, {
          status: 'pendente',
          notes: userNotes
        });
        setDoubtStatus('saved');
        toast.success("Dúvida marcada como pendente!");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-purple-600" />
            Tutoria Inteligente
          </DialogTitle>
          <DialogDescription>
            Análise personalizada do seu erro e sugestões de estudo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Analisando sua resposta...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Explicação da IA */}
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">
                    Explicação Personalizada
                  </h3>
                </div>
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {analysis.explanation}
                </div>
              </CardContent>
            </Card>

            {/* Conceitos Relacionados */}
            {analysis.concepts && analysis.concepts.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Conceitos Relacionados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.concepts.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {concept.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Questões Similares */}
            {analysis.similar_questions && analysis.similar_questions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-green-600" />
                  Questões Similares para Praticar
                </h3>
                <div className="space-y-3">
                  {analysis.similar_questions.map((q) => (
                    <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div 
                              className="text-sm text-gray-700 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: q.statement }}
                            />
                            <div className="flex gap-2 mt-2">
                              {q.subject && (
                                <Badge variant="outline" className="text-xs">
                                  {q.subject.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {q.institution && (
                                <Badge variant="outline" className="text-xs">
                                  {q.institution.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigate(createPageUrl("Questions") + "?question_id=" + q.id);
                              onClose();
                            }}
                          >
                            Praticar
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Seus Pontos Fracos e Plano de Estudo */}
            {studyInsights && studyInsights.weaknesses && studyInsights.weaknesses.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Seus Pontos Fracos & Plano de Estudo
                </h3>
                <Card className="border-orange-200 bg-orange-50 mb-4">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-orange-900 mb-2">Pontos Fracos Recorrentes:</h4>
                    <ul className="list-disc list-inside text-gray-800 mb-4">
                      {studyInsights.weaknesses.slice(0, 5).map((weakness, index) => (
                        <li key={index}>
                          <span className="font-medium">{weakness.subject} › {weakness.topic}:</span> {weakness.incorrect_count} erros ({weakness.accuracy}% acerto)
                        </li>
                      ))}
                    </ul>
                    {studyInsights.study_plan && (
                      <div className="border-t border-orange-200 pt-4 mt-4">
                        <h4 className="font-semibold text-orange-900 mb-2">📚 Plano de Estudo Personalizado:</h4>
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {studyInsights.study_plan}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {studyInsights.focused_exercises && studyInsights.focused_exercises.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      Exercícios Focados no Seu Ponto Fraco
                    </h4>
                    <div className="space-y-3">
                      {studyInsights.focused_exercises.map((q) => (
                        <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div 
                                  className="text-sm text-gray-700 line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: q.statement }}
                                />
                                <div className="flex gap-2 mt-2">
                                  {q.subject && (
                                    <Badge variant="outline" className="text-xs">
                                      {q.subject.replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                  {q.institution && (
                                    <Badge variant="outline" className="text-xs">
                                      {q.institution.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigate(createPageUrl("Questions") + "?question_id=" + q.id);
                                  onClose();
                                }}
                              >
                                Praticar
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Anotações Pessoais e Salvar para Revisão */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                Salvar para Revisão
              </h3>
              <Textarea
                placeholder="Adicione suas anotações sobre esta dúvida..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveDoubt}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {doubtStatus === 'saved' || doubtStatus === 'resolved' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Atualizar Dúvida
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar para Revisão
                    </>
                  )}
                </Button>
                
                {doubtStatus === 'resolved' ? (
                  <Button
                    variant="outline"
                    onClick={handleMarkAsPending}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Marcar como Pendente
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleMarkAsResolved}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Resolvida
                  </Button>
                )}
              </div>
            </div>

            {/* Dica Motivacional */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <p className="text-sm text-green-800">
                  💡 <strong>Dica:</strong> Errar faz parte do aprendizado! Use esta análise para 
                  entender seus pontos fracos e focar seus estudos. Continue praticando questões 
                  similares para dominar este assunto.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            Não foi possível obter a análise. Tente novamente.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}