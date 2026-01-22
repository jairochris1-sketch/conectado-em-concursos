import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, X, Clock, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateSimulation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [timeLimit, setTimeLimit] = useState(120);
  const [questionCount, setQuestionCount] = useState(30);
  
  // Filtros avançados
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedCargos, setSelectedCargos] = useState([]);
  
  // Opções disponíveis
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableInstitutions, setAvailableInstitutions] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableCargos, setAvailableCargos] = useState([]);
  
  const [matchingQuestionsCount, setMatchingQuestionsCount] = useState(0);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    countMatchingQuestions();
  }, [selectedSubjects, selectedInstitutions, selectedYears, selectedCargos]);

  const loadFilterOptions = async () => {
    try {
      const questions = await base44.entities.Question.list();
      
      const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))].sort();
      const institutions = [...new Set(questions.map(q => q.institution).filter(Boolean))].sort();
      const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);
      const cargos = [...new Set(questions.map(q => q.cargo).filter(Boolean))].sort();
      
      setAvailableSubjects(subjects);
      setAvailableInstitutions(institutions);
      setAvailableYears(years);
      setAvailableCargos(cargos);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
      toast.error("Erro ao carregar filtros");
    }
  };

  const countMatchingQuestions = async () => {
    try {
      const filters = {};
      if (selectedSubjects.length > 0) {
        // Para múltiplas seleções, precisamos fazer queries separadas e unir
        const allQuestions = await base44.entities.Question.list();
        let filtered = allQuestions;
        
        if (selectedSubjects.length > 0) {
          filtered = filtered.filter(q => selectedSubjects.includes(q.subject));
        }
        if (selectedInstitutions.length > 0) {
          filtered = filtered.filter(q => selectedInstitutions.includes(q.institution));
        }
        if (selectedYears.length > 0) {
          filtered = filtered.filter(q => selectedYears.includes(q.year));
        }
        if (selectedCargos.length > 0) {
          filtered = filtered.filter(q => selectedCargos.includes(q.cargo));
        }
        
        setMatchingQuestionsCount(filtered.length);
      } else {
        const allQuestions = await base44.entities.Question.list();
        setMatchingQuestionsCount(allQuestions.length);
      }
    } catch (error) {
      console.error("Erro ao contar questões:", error);
    }
  };

  const handleAddSubject = (subject) => {
    if (subject && !selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleAddInstitution = (institution) => {
    if (institution && !selectedInstitutions.includes(institution)) {
      setSelectedInstitutions([...selectedInstitutions, institution]);
    }
  };

  const handleAddYear = (year) => {
    const yearNum = parseInt(year);
    if (yearNum && !selectedYears.includes(yearNum)) {
      setSelectedYears([...selectedYears, yearNum]);
    }
  };

  const handleAddCargo = (cargo) => {
    if (cargo && !selectedCargos.includes(cargo)) {
      setSelectedCargos([...selectedCargos, cargo]);
    }
  };

  const handleRemoveSubject = (subject) => {
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };

  const handleRemoveInstitution = (institution) => {
    setSelectedInstitutions(selectedInstitutions.filter(i => i !== institution));
  };

  const handleRemoveYear = (year) => {
    setSelectedYears(selectedYears.filter(y => y !== year));
  };

  const handleRemoveCargo = (cargo) => {
    setSelectedCargos(selectedCargos.filter(c => c !== cargo));
  };

  const handleCreateSimulation = async () => {
    if (!name.trim()) {
      toast.error("Digite um nome para o simulado");
      return;
    }

    if (questionCount < 5) {
      toast.error("O simulado deve ter no mínimo 5 questões");
      return;
    }

    if (questionCount > matchingQuestionsCount) {
      toast.error(`Apenas ${matchingQuestionsCount} questões disponíveis com os filtros selecionados`);
      return;
    }

    setLoading(true);
    try {
      // Buscar questões com base nos filtros
      const allQuestions = await base44.entities.Question.list();
      let filtered = allQuestions;
      
      if (selectedSubjects.length > 0) {
        filtered = filtered.filter(q => selectedSubjects.includes(q.subject));
      }
      if (selectedInstitutions.length > 0) {
        filtered = filtered.filter(q => selectedInstitutions.includes(q.institution));
      }
      if (selectedYears.length > 0) {
        filtered = filtered.filter(q => selectedYears.includes(q.year));
      }
      if (selectedCargos.length > 0) {
        filtered = filtered.filter(q => selectedCargos.includes(q.cargo));
      }

      // Embaralhar e selecionar questões
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, questionCount);
      const questionIds = selectedQuestions.map(q => q.id);

      // Criar simulado
      const simulation = await base44.entities.Simulation.create({
        name: name.trim(),
        subjects: selectedSubjects,
        institutions: selectedInstitutions,
        years: selectedYears,
        cargos: selectedCargos,
        question_count: questionCount,
        question_ids: questionIds,
        time_limit: timeLimit,
        status: "nao_iniciado"
      });

      toast.success("Simulado criado com sucesso!");
      navigate(createPageUrl("SolveSimulation") + "?id=" + simulation.id);
    } catch (error) {
      console.error("Erro ao criar simulado:", error);
      toast.error("Erro ao criar simulado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("SimuladosDigital"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Criar Novo Simulado
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure seu simulado personalizado com filtros avançados
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Nome do Simulado */}
            <div>
              <Label htmlFor="name">Nome do Simulado</Label>
              <Input
                id="name"
                placeholder="Ex: Simulado Completo - Concurso X"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Configurações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionCount">Número de Questões</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="5"
                  max="200"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="timeLimit">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tempo Limite (minutos)
                </Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="10"
                  max="300"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Filtros Avançados */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros Avançados
              </h3>

              {/* Disciplinas */}
              <div className="mb-4">
                <Label>Disciplinas</Label>
                <Select onValueChange={handleAddSubject}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSubjects.map(subject => (
                    <Badge key={subject} variant="secondary" className="pl-2 pr-1">
                      {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/_/g, ' ')}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveSubject(subject)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bancas */}
              <div className="mb-4">
                <Label>Bancas</Label>
                <Select onValueChange={handleAddInstitution}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione bancas" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstitutions.map(institution => (
                      <SelectItem key={institution} value={institution}>
                        {institution.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedInstitutions.map(institution => (
                    <Badge key={institution} variant="secondary" className="pl-2 pr-1">
                      {institution.toUpperCase()}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveInstitution(institution)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Anos */}
              <div className="mb-4">
                <Label>Anos</Label>
                <Select onValueChange={handleAddYear}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione anos" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedYears.map(year => (
                    <Badge key={year} variant="secondary" className="pl-2 pr-1">
                      {year}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveYear(year)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Cargos */}
              <div className="mb-4">
                <Label>Cargos</Label>
                <Select onValueChange={handleAddCargo}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione cargos" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCargos.map(cargo => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCargos.map(cargo => (
                    <Badge key={cargo} variant="secondary" className="pl-2 pr-1">
                      {cargo.toUpperCase()}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveCargo(cargo)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Contador de Questões */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Questões disponíveis com os filtros:
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {matchingQuestionsCount}
                </span>
              </div>
            </div>

            {/* Botão de Criar */}
            <Button
              onClick={handleCreateSimulation}
              disabled={loading || !name.trim() || questionCount < 5}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                "Criando simulado..."
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Simulado
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}