import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, Target, Timer, TrendingUp } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "D. Constitucional",
  direito_administrativo: "D. Administrativo",
  direito_penal: "D. Penal",
  direito_civil: "D. Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  pedagogia: "Pedagogia"
};

export default function FlashcardStats({ flashcards, reviews }) {
  const getSubjectDistribution = () => {
    const subjects = {};
    flashcards.forEach(card => {
      const subjectName = subjectNames[card.subject] || card.subject;
      subjects[subjectName] = (subjects[subjectName] || 0) + 1;
    });

    return Object.entries(subjects).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getReviewStats = () => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => {
      const dayReviews = reviews.filter(r =>
        new Date(r.created_date).toDateString() === date.toDateString()
      );

      return {
        date: format(date, 'dd/MM'),
        reviews: dayReviews.length,
        avgQuality: dayReviews.length > 0 
          ? Math.round((dayReviews.reduce((sum, r) => sum + r.quality, 0) / dayReviews.length) * 100) / 100
          : 0
      };
    });
  };

  const getDifficultyDistribution = () => {
    const difficulties = { facil: 0, medio: 0, dificil: 0 };
    flashcards.forEach(card => {
      difficulties[card.difficulty] = (difficulties[card.difficulty] || 0) + 1;
    });

    return [
      { name: 'Fácil', value: difficulties.facil, fill: '#10B981' },
      { name: 'Médio', value: difficulties.medio, fill: '#F59E0B' },
      { name: 'Difícil', value: difficulties.dificil, fill: '#EF4444' }
    ].filter(item => item.value > 0);
  };

  const getGeneralStats = () => {
    const totalCards = flashcards.length;
    const activeCards = flashcards.filter(c => c.is_active).length;
    const totalReviews = reviews.length;
    const avgQuality = reviews.length > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.quality, 0) / reviews.length) * 100) / 100
      : 0;
    
    const todayReviews = reviews.filter(r =>
      new Date(r.created_date).toDateString() === new Date().toDateString()
    );

    return {
      totalCards,
      activeCards,
      totalReviews,
      avgQuality,
      todayReviews: todayReviews.length
    };
  };

  const subjectData = getSubjectDistribution();
  const reviewData = getReviewStats();
  const difficultyData = getDifficultyDistribution();
  const stats = getGeneralStats();

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Cartões</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalCards}</p>
              </div>
              <Brain className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cartões Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCards}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revisões Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayReviews}</p>
              </div>
              <Timer className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qualidade Média</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgQuality}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de revisões por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Revisões dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reviews" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por dificuldade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Dificuldade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
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

      {/* Distribuição por disciplina */}
      {subjectData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}