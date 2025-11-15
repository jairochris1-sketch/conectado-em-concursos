
import React, { useState, useEffect, useMemo } from "react";
import { Question } from "@/entities/Question";
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
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import _ from 'lodash';

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
  const [filters, setFilters] = useState({
    institution: "all",
    year: "all",
    subject: "all"
  });

  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true);
      try {
        const questionsData = await Question.list("-created_date", 5000);
        
        const groupedExams = _.groupBy(questionsData, q => 
          `${q.institution}|${q.year}|${q.exam_name}|${q.cargo || ''}`
        );

        const examsList = Object.values(groupedExams).map(examQuestions => {
          const firstQuestion = examQuestions[0];
          const subjects = [...new Set(examQuestions.map(q => q.subject))];
          
          return {
            id: `${firstQuestion.institution}-${firstQuestion.year}-${firstQuestion.exam_name}-${firstQuestion.cargo || ''}`,
            institution: firstQuestion.institution,
            year: firstQuestion.year,
            exam_name: firstQuestion.exam_name,
            cargo: firstQuestion.cargo || '',
            cargoDisplay: firstQuestion.cargo || 'Cargo não especificado',
            subjects: subjects,
            question_count: examQuestions.length,
          };
        }).sort((a, b) => b.year - a.year || a.exam_name.localeCompare(b.exam_name));

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
      filtered = filtered.filter(exam => 
        exam.exam_name.toLowerCase().includes(lowercasedTerm) ||
        exam.cargoDisplay.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (filters.institution !== "all") {
      filtered = filtered.filter(exam => exam.institution === filters.institution);
    }

    if (filters.year !== "all") {
      filtered = filtered.filter(exam => exam.year.toString() === filters.year);
    }

    if (filters.subject !== "all") {
      filtered = filtered.filter(exam => exam.subjects.includes(filters.subject));
    }

    setFilteredExams(filtered);
  }, [exams, searchTerm, filters]);

  const uniqueValues = useMemo(() => {
    const institutions = [...new Set(exams.map(e => e.institution))].filter(Boolean).sort();
    const years = [...new Set(exams.map(e => e.year))].filter(Boolean).sort((a, b) => b - a);
    const subjects = [...new Set(exams.flatMap(e => e.subjects))].filter(Boolean).sort();
    return { institutions, years, subjects };
  }, [exams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookCopy className="w-12 h-12 animate-bounce text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando provas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Provas de Concursos Públicos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acesse questões organizadas por prova, instituição e cargo.
          </p>
        </motion.div>

        {/* Filtros e Busca */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrar Provas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar prova ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.institution} onValueChange={(value) => setFilters(prev => ({...prev, institution: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Bancas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Bancas</SelectItem>
                  {uniqueValues.institutions.map(inst => (
                    <SelectItem key={inst} value={inst}>
                      {institutionNames[inst] || inst.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({...prev, year: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {uniqueValues.years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({...prev, subject: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {uniqueValues.subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subjectNames[subject] || subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredExams.length} {filteredExams.length === 1 ? 'prova encontrada' : 'provas encontradas'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ institution: "all", year: "all", subject: "all" });
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Provas */}
        <div className="space-y-4">
          {filteredExams.map((exam, index) => {
            const linkCargo = exam.cargo || 'null';
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={createPageUrl(`ExamView?institution=${exam.institution}&year=${exam.year}&exam_name=${encodeURIComponent(exam.exam_name)}&cargo=${encodeURIComponent(linkCargo)}`)}
                >
                  <Card className="hover:shadow-md hover:border-blue-500 transition-all duration-200 group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors line-clamp-1">
                          {exam.exam_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            <span>{institutionNames[exam.institution] || exam.institution.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{exam.cargoDisplay}</span>
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
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filteredExams.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <BookCopy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma prova encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros para encontrar o que procura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
