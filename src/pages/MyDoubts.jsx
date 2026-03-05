import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  Trash2,
  Eye,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function MyDoubts() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [activeTab, setActiveTab] = useState("pendente");

  useEffect(() => {
    loadDoubts();
  }, []);

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const allDoubts = await base44.entities.QuestionDoubt.filter({
        created_by: user.email
      });

      setDoubts(allDoubts.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ));

      // Carregar questões relacionadas
      const questionIds = [...new Set(allDoubts.map(d => d.question_id))];
      const questionsData = {};
      
      for (const id of questionIds) {
        try {
          const q = await base44.entities.Question.filter({ id });
          if (q && q.length > 0) {
            questionsData[id] = q[0];
          }
        } catch (error) {
          console.error(`Erro ao carregar questão ${id}:`, error);
        }
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error("Erro ao carregar dúvidas:", error);
      toast.error("Erro ao carregar suas dúvidas");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsResolved = async (doubtId) => {
    try {
      await base44.entities.QuestionDoubt.update(doubtId, {
        status: 'resolvida'
      });
      
      setDoubts(doubts.map(d => 
        d.id === doubtId ? { ...d, status: 'resolvida' } : d
      ));
      
      toast.success("Dúvida marcada como resolvida!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleMarkAsPending = async (doubtId) => {
    try {
      await base44.entities.QuestionDoubt.update(doubtId, {
        status: 'pendente'
      });
      
      setDoubts(doubts.map(d => 
        d.id === doubtId ? { ...d, status: 'pendente' } : d
      ));
      
      toast.success("Dúvida marcada como pendente!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (doubtId) => {
    if (!confirm("Deseja realmente excluir esta dúvida?")) return;
    
    try {
      await base44.entities.QuestionDoubt.delete(doubtId);
      setDoubts(doubts.filter(d => d.id !== doubtId));
      toast.success("Dúvida excluída!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao excluir dúvida");
    }
  };

  const filteredDoubts = doubts.filter(doubt => {
    if (doubt.status !== activeTab) return false;
    
    if (selectedSubject !== "all" && doubt.subject !== selectedSubject) {
      return false;
    }
    
    if (searchTerm) {
      const question = questions[doubt.question_id];
      const searchLower = searchTerm.toLowerCase();
      return (
        doubt.subject?.toLowerCase().includes(searchLower) ||
        doubt.topic?.toLowerCase().includes(searchLower) ||
        question?.statement?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const uniqueSubjects = [...new Set(doubts.map(d => d.subject).filter(Boolean))];
  const pendingCount = doubts.filter(d => d.status === 'pendente').length;
  const resolvedCount = doubts.filter(d => d.status === 'resolvida').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando suas dúvidas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 px-2 hover:bg-white hidden md:flex">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Minhas Dúvidas
            </h1>
            <p className="text-gray-600">
              Revise as questões que você salvou para estudar melhor
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Dúvidas</p>
                  <p className="text-3xl font-bold text-gray-900">{doubts.length}</p>
                </div>
                <BookOpen className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolvidas</p>
                  <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar por disciplina, assunto ou questão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {uniqueSubjects.length > 0 && (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border rounded-lg bg-white text-gray-900"
                >
                  <option value="all">Todas as Disciplinas</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pendente" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pendentes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="resolvida" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resolvidas ({resolvedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredDoubts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">
                    {activeTab === 'pendente' 
                      ? 'Nenhuma dúvida pendente'
                      : 'Nenhuma dúvida resolvida'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activeTab === 'pendente'
                      ? 'Quando você errar uma questão, use a opção "Pedir Ajuda" para salvá-la aqui'
                      : 'Continue estudando e marcando suas dúvidas como resolvidas'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredDoubts.map((doubt) => {
                  const question = questions[doubt.question_id];
                  
                  return (
                    <Card key={doubt.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {doubt.subject && (
                                <Badge variant="secondary">
                                  {doubt.subject.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {doubt.topic && (
                                <Badge variant="outline">
                                  {doubt.topic}
                                </Badge>
                              )}
                            </div>
                            {question && (
                              <div 
                                className="text-sm text-gray-700 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: question.statement }}
                              />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {/* Explicação da IA */}
                        {doubt.ai_explanation && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-purple-900 mb-2">
                              💡 Explicação da IA:
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                              {doubt.ai_explanation}
                            </p>
                          </div>
                        )}

                        {/* Anotações */}
                        {doubt.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-yellow-900 mb-2">
                              📝 Suas Anotações:
                            </p>
                            <p className="text-sm text-gray-700">
                              {doubt.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-gray-500">
                            Salva em {new Date(doubt.created_date).toLocaleDateString('pt-BR')}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(createPageUrl("Questions") + "?question_id=" + doubt.question_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Questão
                            </Button>
                            
                            {doubt.status === 'pendente' ? (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsResolved(doubt.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Marcar como Resolvida
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPending(doubt.id)}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Marcar como Pendente
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(doubt.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}