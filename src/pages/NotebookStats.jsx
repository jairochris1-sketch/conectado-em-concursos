import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function NotebookStats() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const notebookId = urlParams.get('id');

  const [notebook, setNotebook] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [topicStats, setTopicStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [notebookId]);

  const loadStats = async () => {
    try {
      const notebookData = await base44.entities.Notebook.get(notebookId);
      setNotebook(notebookData);

      const [attemptsData, notebookQuestions] = await Promise.all([
        base44.entities.NotebookAttempt.filter({ notebook_id: notebookId }),
        base44.entities.NotebookQuestion.filter({ notebook_id: notebookId })
      ]);

      const sortedAttempts = attemptsData.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      setAttempts(sortedAttempts);

      const questionIds = notebookQuestions.map(q => q.question_id);
      const questionsData = await Promise.all(
        questionIds.map(id => base44.entities.Question.get(id))
      );
      setQuestions(questionsData);

      // Calcular estatísticas por disciplina
      const subjectMap = {};
      questionsData.forEach(q => {
        if (!subjectMap[q.subject]) {
          subjectMap[q.subject] = { total: 0, correct: 0 };
        }
        subjectMap[q.subject].total++;
      });

      // Contar acertos por disciplina de todas as tentativas concluídas
      const completedAttempts = sortedAttempts.filter(a => a.status === 'completed');
      completedAttempts.forEach(attempt => {
        attempt.answers?.forEach(answer => {
          const question = questionsData.find(q => q.id === answer.question_id);
          if (question && answer.is_correct && subjectMap[question.subject]) {
            subjectMap[question.subject].correct++;
          }
        });
      });

      const subjectData = Object.keys(subjectMap).map(subject => ({
        name: subject,
        acertos: subjectMap[subject].correct,
        total: subjectMap[subject].total * completedAttempts.length,
        percentual: completedAttempts.length > 0 
          ? ((subjectMap[subject].correct / (subjectMap[subject].total * completedAttempts.length)) * 100).toFixed(1)
          : 0
      }));

      setSubjectStats(subjectData);

      // Calcular estatísticas por assunto
      const topicMap = {};
      questionsData.forEach(q => {
        if (q.topic) {
          if (!topicMap[q.topic]) {
            topicMap[q.topic] = { total: 0, correct: 0 };
          }
          topicMap[q.topic].total++;
        }
      });

      completedAttempts.forEach(attempt => {
        attempt.answers?.forEach(answer => {
          const question = questionsData.find(q => q.id === answer.question_id);
          if (question && question.topic && answer.is_correct && topicMap[question.topic]) {
            topicMap[question.topic].correct++;
          }
        });
      });

      const topicData = Object.keys(topicMap)
        .map(topic => ({
          name: topic,
          acertos: topicMap[topic].correct,
          total: topicMap[topic].total * completedAttempts.length,
          percentual: completedAttempts.length > 0
            ? ((topicMap[topic].correct / (topicMap[topic].total * completedAttempts.length)) * 100).toFixed(1)
            : 0
        }))
        .sort((a, b) => b.percentual - a.percentual)
        .slice(0, 10);

      setTopicStats(topicData);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
    : 0;

  const bestAttempt = completedAttempts.length > 0
    ? completedAttempts.reduce((best, current) => 
        (current.score || 0) > (best.score || 0) ? current : best
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Notebooks"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Estatísticas - {notebook?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Análise detalhada do seu desempenho neste caderno
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{questions.length}</div>
                <div className="text-sm text-gray-600">Total de Questões</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{completedAttempts.length}</div>
                <div className="text-sm text-gray-600">Tentativas Concluídas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{avgScore.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Média Geral</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {bestAttempt ? `${bestAttempt.score.toFixed(1)}%` : '-'}
                </div>
                <div className="text-sm text-gray-600">Melhor Resultado</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'percentual') return `${value}%`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="percentual" fill="#3b82f6" name="% Acertos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma tentativa concluída ainda
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Assuntos</CardTitle>
            </CardHeader>
            <CardContent>
              {topicStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicStats} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'percentual') return `${value}%`;
                        return value;
                      }}
                    />
                    <Bar dataKey="percentual" fill="#10b981" name="% Acertos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum dado de assunto disponível
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Tentativas</CardTitle>
          </CardHeader>
          <CardContent>
            {completedAttempts.length > 0 ? (
              <div className="space-y-3">
                {completedAttempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-blue-600">
                          #{completedAttempts.length - index}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {attempt.score?.toFixed(1)}% de aproveitamento
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(attempt.completed_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-green-600 font-bold text-lg">
                          {attempt.correct_count}
                        </div>
                        <div className="text-gray-600">Acertos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-bold text-lg">
                          {attempt.wrong_count}
                        </div>
                        <div className="text-gray-600">Erros</div>
                      </div>
                      <Badge 
                        variant={attempt.score >= 70 ? 'default' : 'destructive'}
                        className="ml-4"
                      >
                        {attempt.score >= 70 ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhuma tentativa concluída ainda
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Resolva o caderno para ver suas estatísticas aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}