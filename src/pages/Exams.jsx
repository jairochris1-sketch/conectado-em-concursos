import { useState, useEffect, useMemo } from "react";
import { Question } from "@/entities/Question";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  FileText,
  Calendar,
  Building,
  ChevronRight,
  Filter,
  BookCopy,
  Briefcase,
  Grid3x3,
  List,
  LayoutGrid,
  Star,
  Lock } from
"lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import _ from 'lodash';
import { toast } from "sonner";

const institutionNames = {
  fcc: "FCC",
  cespe: "CESPE/CEBRASPE",
  vunesp: "VUNESP",
  fgv: "FGV",
  cesgranrio: "CESGRANRIO",
  esaf: "ESAF",
  idecan: "IDECAN",
  fundatec: "FUNDATEC",
  consulplan: "CONSULPLAN",
  instituto_aocp: "AOCP",
  ibade: "IBADE",
  quadrix: "QUADRIX",
  ibfc: "IBFC",
  objetiva: "Objetiva",
  iades: "IADES",
  itame: "ITAME"
};

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  administracao_publica: "Administração Pública",
  economia: "Economia",
  estatistica: "Estatística",
  pedagogia: "Pedagogia"
};

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [filters, setFilters] = useState({
    institution: "all",
    year: "all",
    subject: "all",
    favoritesOnly: false
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('examsViewMode') || 'list';
  });
  const [userPlan, setUserPlan] = useState('gratuito');

  useEffect(() => {
    const checkPlan = async () => {
      try {
        const userData = await User.me();
        let plan = userData.current_plan || 'gratuito';
        const activeSubscriptions = await base44.entities.Subscription.filter({ user_email: userData.email, status: 'active' });
        const specialUsers = await base44.entities.SpecialUser.filter({ email: userData.email, is_active: true });
        
        if (activeSubscriptions.length > 0) {
          const hasPremium = activeSubscriptions.some(sub => sub.plan === 'avancado');
          const hasStandard = activeSubscriptions.some(sub => sub.plan === 'padrao');
          plan = hasPremium ? 'avancado' : (hasStandard ? 'padrao' : activeSubscriptions[0].plan);
        }
        if (specialUsers.length > 0) {
          const specialUser = specialUsers[0];
          if (!specialUser.valid_until || new Date(specialUser.valid_until) >= new Date()) {
            plan = specialUser.plan;
          }
        }

        const userIsAdmin = userData.email === 'conectadoemconcursos@gmail.com' || userData.email === 'jairochris1@gmail.com' || userData.email === 'juniorgmj2016@gmail.com' || userData.role === 'admin';
        if (userIsAdmin) {
          plan = 'avancado';
        }

        setUserPlan(plan);
      } catch (e) {
         console.error(e);
      }
    };
    checkPlan();
  }, []);

  useEffect(() => {
    localStorage.setItem('examsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true);
      try {
        const questionsData = await Question.list("-created_date", 5000);

        const groupedExams = _.groupBy(questionsData, (q) =>
        `${q.institution}|${q.year}|${q.exam_name}|${q.cargo || 'N/A'}`
        );

        const examsList = Object.values(groupedExams).map((examQuestions) => {
          const firstQuestion = examQuestions[0];
          const subjects = [...new Set(examQuestions.map((q) => q.subject))];

          // Buscar a primeira imagem disponível em todas as questões do exame
          const coverImage = examQuestions.find((q) => q.exam_cover_image)?.exam_cover_image || null;

          return {
            id: `${firstQuestion.institution}-${firstQuestion.year}-${firstQuestion.exam_name}-${firstQuestion.cargo || 'N/A'}`,
            institution: firstQuestion.institution,
            year: firstQuestion.year,
            exam_name: firstQuestion.exam_name,
            cargo: firstQuestion.cargo || 'Cargo não especificado',
            subjects: subjects,
            question_count: examQuestions.length,
            cover_image: coverImage
          };
        }).sort((a, b) => b.year - a.year || a.exam_name.localeCompare(b.exam_name));

        const favs = await base44.entities.FavoriteExam.list();
        setFavorites(favs.map((f) => f.exam_id));

        setExams(examsList);
        setFilteredExams(examsList);
      } catch (error) {
        console.error("Erro ao carregar provas:", error);
      }
      setIsLoading(false);
    };

    loadExams();
  }, []);

  useEffect(() => {
    let filtered = exams;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((exam) =>
      exam.exam_name.toLowerCase().includes(lowercasedTerm) ||
      exam.cargo.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (filters.institution !== "all") {
      filtered = filtered.filter((exam) => exam.institution === filters.institution);
    }

    if (filters.year !== "all") {
      filtered = filtered.filter((exam) => exam.year.toString() === filters.year);
    }

    if (filters.subject !== "all") {
      filtered = filtered.filter((exam) => exam.subjects.includes(filters.subject));
    }

    if (filters.favoritesOnly) {
      filtered = filtered.filter((exam) => favorites.includes(exam.id));
    }

    setFilteredExams(filtered);
    setCurrentPage(1);
  }, [exams, searchTerm, filters, favorites]);

  const toggleFavorite = async (e, examId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (favorites.includes(examId)) {
        const toDelete = await base44.entities.FavoriteExam.filter({ exam_id: examId });
        if (toDelete.length > 0) {
          await base44.entities.FavoriteExam.delete(toDelete[0].id);
        }
        setFavorites((prev) => prev.filter((id) => id !== examId));
      } else {
        await base44.entities.FavoriteExam.create({ exam_id: examId });
        setFavorites((prev) => [...prev, examId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const paginatedExams = filteredExams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);

  const uniqueValues = useMemo(() => {
    const institutions = [...new Set(exams.map((e) => e.institution))].filter(Boolean).sort();
    const years = [...new Set(exams.map((e) => e.year))].filter(Boolean).sort((a, b) => b - a);
    const subjects = [...new Set(exams.flatMap((e) => e.subjects))].filter(Boolean).sort();
    return { institutions, years, subjects };
  }, [exams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookCopy className="w-12 h-12 animate-bounce text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando provas...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-900 dark:text-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Provas de Concursos Públicos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acesse questões organizadas por prova, instituição e cargo.
          </p>
        </motion.div>

        {/* Filtros e Busca */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="bg-transparent p-6 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtrar Provas
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Visualização:</span>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  title="Grade">

                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  title="Lista">

                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className={viewMode === 'compact' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  title="Compacto">

                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-transparent p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar prova ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10" />

              </div>
              
              <Select value={filters.institution} onValueChange={(value) => setFilters((prev) => ({ ...prev, institution: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Bancas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Bancas</SelectItem>
                  {uniqueValues.institutions.map((inst) =>
                  <SelectItem key={inst} value={inst}>
                      {institutionNames[inst] || inst.toUpperCase()}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={filters.year} onValueChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {uniqueValues.years.map((year) =>
                  <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={filters.subject} onValueChange={(value) => setFilters((prev) => ({ ...prev, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {uniqueValues.subjects.map((subject) =>
                  <SelectItem key={subject} value={subject}>
                      {subjectNames[subject] || subject.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredExams.length} {filteredExams.length === 1 ? 'prova encontrada' : 'provas encontradas'}
                </p>
                <Button
                  variant={filters.favoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                  className={filters.favoritesOnly ? "bg-amber-500 hover:bg-amber-600 text-white border-none" : "text-gray-600"}>

                  <Star className={`w-4 h-4 mr-2 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
                  Apenas Favoritos
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ institution: "all", year: "all", subject: "all", favoritesOnly: false });
                }} className="bg-blue-600 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-9">

                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Provas */}
        <div className={
        viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' :
        viewMode === 'list' ? 'space-y-4' :
        'grid grid-cols-1 md:grid-cols-2 gap-3'
        }>
          {paginatedExams.map((exam, index) =>
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}>

              <Link
              to={userPlan === 'gratuito' ? '#' : createPageUrl(`ExamView?institution=${exam.institution}&year=${exam.year}&exam_name=${encodeURIComponent(exam.exam_name)}&cargo=${encodeURIComponent(exam.cargo)}`)}
              onClick={(e) => {
                if (userPlan === 'gratuito') {
                  e.preventDefault();
                  toast.error("O acesso às provas completas é exclusivo para assinantes. Faça um upgrade para acessar.");
                }
              }}
              >

                {viewMode === 'grid' ?
              <Card className="hover:shadow-lg hover:border-blue-500 transition-all duration-200 group h-full">
                    <CardHeader className="bg-transparent p-6 flex flex-col space-y-1.5">
                      <div className="flex items-start gap-3">
                        {exam.cover_image &&
                    <img
                      src={exam.cover_image}
                      alt={exam.exam_name}
                      className="w-12 h-12 object-contain flex-shrink-0 rounded" />

                    }
                        <CardTitle className="text-gray-900 text-base font-semibold tracking-tight dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 flex-1 flex items-center gap-2">
                          {exam.exam_name}
                          {userPlan === 'gratuito' && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </CardTitle>
                        <button
                      onClick={(e) => toggleFavorite(e, exam.id)}
                      className="text-gray-400 hover:text-amber-500 transition-colors shrink-0">

                          <Star className={`w-5 h-5 ${favorites.includes(exam.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="bg-transparent p-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{institutionNames[exam.institution] || exam.institution.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{exam.cargo}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{exam.year}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{exam.question_count} questões</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card> :
              viewMode === 'list' ?
              <Card className="hover:shadow-md hover:border-blue-500 transition-all duration-200 group">
                    <CardContent className="bg-transparent p-4 flex items-center justify-between gap-3">
                      {exam.cover_image &&
                  <img
                    src={exam.cover_image}
                    alt={exam.exam_name}
                    className="w-16 h-16 object-contain flex-shrink-0 rounded" />

                  }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-blue-900 text-lg font-semibold dark:text-white group-hover:text-gray-700 dark:group-hover:text-blue-100 transition-colors line-clamp-1">
                            {exam.exam_name}
                          </p>
                          {userPlan === 'gratuito' && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            <span>{institutionNames[exam.institution] || exam.institution.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{exam.cargo}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{exam.year}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>{exam.question_count} questões</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <button
                      onClick={(e) => toggleFavorite(e, exam.id)}
                      className="text-gray-400 hover:text-amber-500 transition-colors shrink-0">

                          <Star className={`w-5 h-5 ${favorites.includes(exam.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card> :

              <Card className="hover:shadow-md hover:border-blue-500 transition-all duration-200 group">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        {exam.cover_image &&
                    <img
                      src={exam.cover_image}
                      alt={exam.exam_name}
                      className="w-10 h-10 object-contain flex-shrink-0 rounded" />

                    }
                        <div className="flex-1 flex items-center gap-2">
                          <p className="text-sm font-semibold text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-blue-100 transition-colors line-clamp-2">
                            {exam.exam_name}
                          </p>
                          {userPlan === 'gratuito' && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </div>
                        <button
                      onClick={(e) => toggleFavorite(e, exam.id)}
                      className="text-gray-400 hover:text-amber-500 transition-colors shrink-0">

                          <Star className={`w-4 h-4 ${favorites.includes(exam.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{institutionNames[exam.institution] || exam.institution.toUpperCase()}</span>
                          <span>{exam.year}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="line-clamp-1 text-gray-700 dark:text-gray-300">{exam.cargo}</span>
                          <span className="font-medium whitespace-nowrap ml-2">{exam.question_count} questões</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              }
              </Link>
            </motion.div>
          )}
        </div>

        {filteredExams.length === 0 && !isLoading &&
        <div className="text-center py-16">
            <BookCopy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma prova encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros para encontrar o que procura.
            </p>
          </div>
        }

        {totalPages > 1 &&
        <div className="flex justify-center mt-8 gap-2">
            <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}>

              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}>

              Próxima
            </Button>
          </div>
        }
      </div>
    </div>);

}