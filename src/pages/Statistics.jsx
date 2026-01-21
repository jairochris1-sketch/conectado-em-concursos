import { useState, useEffect } from "react";
import { UserAnswer, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Target, BookOpen, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática", 
  direito_constitucional: "D. Constitucional",
  direito_administrativo: "D. Administrativo",
  direito_penal: "D. Penal",
  direito_civil: "D. Civil",
  direito_tributario: "D. Tributário",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  pedagogia: "Pedagogia"
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function StatisticsPage() {
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnswers();
  }, []);

  const loadAnswers = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const answersData = await UserAnswer.filter({ created_by: user.email }, "-created_date", 1000);
      setAnswers(answersData);
    } catch (error) {
      console.error("Erro ao carregar respostas:", error);
    }
    setIsLoading(false);
  };

  const getSubjectStats = () => {
    const subjectData = {};
    
    answers.forEach(answer => {
      if (!subjectData[answer.subject]) {
        subjectData[answer.subject] = { total: 0, correct: 0 };
      }
      subjectData[answer.subject].total++;
      if (answer.is_correct) {
        subjectData[answer.subject].correct++;
      }
    });

    return Object.entries(subjectData)
      .map(([subject, data]) => ({
        subject: subjectNames[subject] || subject,
        total: data.total,
        correct: data.correct,
        accuracy: Math.round((data.correct / data.total) * 100),
        errors: data.total - data.correct
      }))
      .sort((a, b) => b.total - a.total);
  };

  const getPerformanceOverTime = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayAnswers = answers.filter(a => 
        new Date(a.created_date).toDateString() === date.toDateString()
      );
      
      const correct = dayAnswers.filter(a => a.is_correct).length;
      const total = dayAnswers.length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        date: format(date, 'dd/MM'),
        accuracy,
        total,
        correct
      };
    });
  };

  const getInstitutionStats = () => {
    const institutionData = {};
    
    answers.forEach(answer => {
      if (!institutionData[answer.institution]) {
        institutionData[answer.institution] = { total: 0, correct: 0 };
      }
      institutionData[answer.institution].total++;
      if (answer.is_correct) {
        institutionData[answer.institution].correct++;
      }
    });

    return Object.entries(institutionData)
      .map(([institution, data]) => ({
        institution: institution.toUpperCase(),
        total: data.total,
        accuracy: Math.round((data.correct / data.total) * 100)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  };

  const getGeneralStats = () => {
    const total = answers.length;
    const correct = answers.filter(a => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    const todayAnswers = answers.filter(a => 
      new Date(a.created_date).toDateString() === new Date().toDateString()
    );

    return {
      total,
      correct,
      accuracy,
      todayTotal: todayAnswers.length,
      todayCorrect: todayAnswers.filter(a => a.is_correct).length
    };
  };

  const subjectStats = getSubjectStats();
  const performanceData = getPerformanceOverTime();
  const institutionStats = getInstitutionStats();
  const generalStats = getGeneralStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 animate-pulse text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Estatísticas Detalhadas
            </h1>
            <p className="text-gray-600">
              Análise completa do seu desempenho nos estudos
            </p>
          </motion.div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Nenhum dado disponível</p>
            <p className="text-gray-600 mb-6">Você ainda não resolveu nenhuma questão. Comece a estudar para ver suas estatísticas!</p>
            <Link to={createPageUrl("Questions")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Resolver Questões
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Estatísticas Detalhadas
          </h1>
          <p className="text-gray-600">
            Análise completa do seu desempenho nos estudos
          </p>
        </motion.div>

        {/* Cards de estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Questões</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.total}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Acerto</p>
                  <p className="text-2xl font-bold text-green-600">{generalStats.accuracy}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoje</p>
                  <p className="text-2xl font-bold text-purple-600">{generalStats.todayTotal}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Acertos Hoje</p>
                  <p className="text-2xl font-bold text-orange-600">{generalStats.todayCorrect}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de desempenho por disciplina */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Desempenho por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de performance ao longo do tempo */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Performance dos Últimos 30 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Estatísticas por banca */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Desempenho por Banca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {institutionStats.map((stat, index) => (
                  <div key={stat.institution} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{stat.institution}</p>
                      <p className="text-sm text-gray-600">{stat.total} questões</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-indigo-600">{stat.accuracy}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de acertos/erros */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Distribuição Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Acertos', value: generalStats.correct, fill: '#10B981' },
                        { name: 'Erros', value: generalStats.total - generalStats.correct, fill: '#EF4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Acertos', value: generalStats.correct, fill: '#10B981' },
                        { name: 'Erros', value: generalStats.total - generalStats.correct, fill: '#EF4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}