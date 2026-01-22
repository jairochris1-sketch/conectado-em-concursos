import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, X, Search, GripVertical, ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CreateNotebook() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const notebookId = urlParams.get('id');

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "private",
    difficulty: "misto"
  });

  const [filters, setFilters] = useState({
    subjects: [],
    topics: [],
    institutions: [],
    years: [],
    cargos: [],
    difficulties: [],
    education_levels: []
  });

  const [availableOptions, setAvailableOptions] = useState({
    subjects: [],
    topics: [],
    institutions: [],
    years: [],
    cargos: []
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [commentDialog, setCommentDialog] = useState({ open: false, questionId: null, comment: "" });

  useEffect(() => {
    loadOptions();
    if (notebookId) {
      loadNotebook();
    }
  }, [notebookId]);

  const loadOptions = async () => {
    try {
      const questions = await base44.entities.Question.list();

      // Lista completa de disciplinas
      const allSubjects = [
        { id: 'portugues', value: 'portugues', label: 'Português' },
        { id: 'matematica', value: 'matematica', label: 'Matemática' },
        { id: 'direito_constitucional', value: 'direito_constitucional', label: 'Direito Constitucional' },
        { id: 'direito_administrativo', value: 'direito_administrativo', label: 'Direito Administrativo' },
        { id: 'direito_penal', value: 'direito_penal', label: 'Direito Penal' },
        { id: 'direito_civil', value: 'direito_civil', label: 'Direito Civil' },
        { id: 'informatica', value: 'informatica', label: 'Informática' },
        { id: 'conhecimentos_gerais', value: 'conhecimentos_gerais', label: 'Conhecimentos Gerais' },
        { id: 'raciocinio_logico', value: 'raciocinio_logico', label: 'Raciocínio Lógico' },
        { id: 'contabilidade', value: 'contabilidade', label: 'Contabilidade' },
        { id: 'pedagogia', value: 'pedagogia', label: 'Pedagogia' }
      ];

      // Lista completa de instituições (bancas)
      const allInstitutions = [
        { id: 'fcc', name: 'FCC' },
        { id: 'cespe', name: 'CESPE' },
        { id: 'vunesp', name: 'VUNESP' },
        { id: 'fgv', name: 'FGV' },
        { id: 'cesgranrio', name: 'CESGRANRIO' },
        { id: 'esaf', name: 'ESAF' },
        { id: 'fundatec', name: 'FUNDATEC' },
        { id: 'consulplan', name: 'CONSULPLAN' },
        { id: 'idecan', name: 'IDECAN' },
        { id: 'aocp', name: 'AOCP' },
        { id: 'quadrix', name: 'QUADRIX' },
        { id: 'instituto_aocp', name: 'INSTITUTO AOCP' },
        { id: 'planejar', name: 'PLANEJAR' },
        { id: 'ibptec', name: 'IBPTEC' },
        { id: 'amiga_publica', name: 'AMIGA PUBLICA' },
        { id: 'ibade', name: 'IBADE' },
        { id: 'ibfc', name: 'IBFC' },
        { id: 'objetiva', name: 'OBJETIVA' },
        { id: 'iades', name: 'IADES' },
        { id: 'itame', name: 'ITAME' },
        { id: 'consep', name: 'CONSEP' },
        { id: 'outras', name: 'OUTRAS' }
      ];

      const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);
      const cargos = [...new Set(questions.map(q => q.cargo).filter(Boolean))].sort();
      const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();

      setAvailableOptions({
        subjects: allSubjects,
        institutions: allInstitutions,
        years,
        cargos,
        topics
      });
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
      toast.error("Erro ao carregar filtros");
    }
  };

  const loadNotebook = async () => {
    try {
      const notebook = await base44.entities.Notebook.get(notebookId);
      setFormData({
        name: notebook.name,
        description: notebook.description || "",
        type: notebook.type,
        difficulty: notebook.difficulty || "misto"
      });

      if (notebook.filters) {
        setFilters(notebook.filters);
      }

      const notebookQuestions = await base44.entities.NotebookQuestion.filter({ 
        notebook_id: notebookId 
      });

      const sortedNQ = notebookQuestions.sort((a, b) => a.order - b.order);
      const questionIds = sortedNQ.map(q => q.question_id);
      const questions = await Promise.all(
        questionIds.map(id => base44.entities.Question.get(id))
      );

      const questionsWithComments = questions.map((q, idx) => ({
        ...q,
        notebookQuestionId: sortedNQ[idx].id,
        user_comment: sortedNQ[idx].user_comment || "",
        show_explanation: sortedNQ[idx].show_explanation !== false
      }));

      setSelectedQuestions(questionsWithComments);
    } catch (error) {
      console.error("Erro ao carregar caderno:", error);
      toast.error("Erro ao carregar caderno");
    }
  };

  const handleSearchQuestions = async () => {
    setSearching(true);
    try {
      let query = {};

      if (filters.subjects.length > 0) {
        query.subject = { $in: filters.subjects };
      }
      if (filters.institutions.length > 0) {
        query.institution = { $in: filters.institutions };
      }
      if (filters.years.length > 0) {
        query.year = { $in: filters.years.map(Number) };
      }
      if (filters.cargos.length > 0) {
        query.cargo = { $in: filters.cargos };
      }
      if (filters.difficulties.length > 0) {
        query.difficulty = { $in: filters.difficulties };
      }
      if (filters.education_levels.length > 0) {
        query.education_level = { $in: filters.education_levels };
      }
      if (filters.topics.length > 0) {
        query.topic = { $in: filters.topics };
      }

      const questions = await base44.entities.Question.filter(query);
      setSearchResults(questions);
      toast.success(`${questions.length} questões encontradas`);
    } catch (error) {
      console.error("Erro ao buscar questões:", error);
      toast.error("Erro ao buscar questões");
    } finally {
      setSearching(false);
    }
  };

  const handleAddQuestion = (question) => {
    if (!selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, { 
        ...question, 
        user_comment: "", 
        show_explanation: true 
      }]);
      toast.success("Questão adicionada");
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const handleAddAllResults = () => {
    const newQuestions = searchResults.filter(
      result => !selectedQuestions.find(q => q.id === result.id)
    ).map(q => ({ ...q, user_comment: "", show_explanation: true }));
    
    setSelectedQuestions([...selectedQuestions, ...newQuestions]);
    toast.success(`${newQuestions.length} questões adicionadas`);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedQuestions(items);
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedQuestions.length) return;

    const items = Array.from(selectedQuestions);
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);
    setSelectedQuestions(items);
  };

  const handleSaveComment = () => {
    setSelectedQuestions(selectedQuestions.map(q => 
      q.id === commentDialog.questionId 
        ? { ...q, user_comment: commentDialog.comment }
        : q
    ));
    setCommentDialog({ open: false, questionId: null, comment: "" });
    toast.success("Comentário salvo");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Informe o nome do caderno");
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error("Adicione pelo menos uma questão");
      return;
    }

    setLoading(true);
    try {
      const notebookData = {
        ...formData,
        filters,
        question_count: selectedQuestions.length
      };

      let notebook;
      if (notebookId) {
        await base44.entities.Notebook.update(notebookId, notebookData);
        notebook = { id: notebookId };

        const oldQuestions = await base44.entities.NotebookQuestion.filter({ 
          notebook_id: notebookId 
        });
        await Promise.all(oldQuestions.map(q => 
          base44.entities.NotebookQuestion.delete(q.id)
        ));
      } else {
        notebook = await base44.entities.Notebook.create(notebookData);
      }

      await Promise.all(
        selectedQuestions.map((q, index) => 
          base44.entities.NotebookQuestion.create({
            notebook_id: notebook.id,
            question_id: q.id,
            order: index + 1,
            user_comment: q.user_comment || "",
            show_explanation: q.show_explanation !== false
          })
        )
      );

      toast.success(notebookId ? "Caderno atualizado!" : "Caderno criado!");
      navigate(createPageUrl("Notebooks"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar caderno");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      facil: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      medio: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      dificil: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    };
    return colors[difficulty] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Notebooks"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {notebookId ? "Editar Caderno" : "Novo Caderno de Questões"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Caderno *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Português - FCC 2024"
                    required
                  />
                </div>

                <div>
                  <Label>Dificuldade Geral</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({...formData, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="misto">Misto</SelectItem>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o objetivo deste caderno..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tipo de Caderno</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privado (só eu vejo)</SelectItem>
                    <SelectItem value="public">Público (outros podem ver)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtros Avançados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Disciplinas</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.subjects.includes(value)) {
                        setFilters({...filters, subjects: [...filters.subjects, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.subjects.map(s => (
                        <SelectItem key={s.id} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.subjects.map(s => (
                      <Badge key={s} variant="secondary">
                        {availableOptions.subjects.find(opt => opt.value === s)?.label}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            subjects: filters.subjects.filter(x => x !== s)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Bancas</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.institutions.includes(value)) {
                        setFilters({...filters, institutions: [...filters.institutions, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.institutions.map(i => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.institutions.map(i => (
                      <Badge key={i} variant="secondary">
                        {availableOptions.institutions.find(opt => opt.id === i)?.name}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            institutions: filters.institutions.filter(x => x !== i)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Dificuldade</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.difficulties.includes(value)) {
                        setFilters({...filters, difficulties: [...filters.difficulties, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.difficulties.map(d => (
                      <Badge key={d} className={getDifficultyColor(d)}>
                        {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : 'Difícil'}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            difficulties: filters.difficulties.filter(x => x !== d)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Anos</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.years.includes(value)) {
                        setFilters({...filters, years: [...filters.years, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.years.map(y => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.years.map(y => (
                      <Badge key={y} variant="secondary">
                        {y}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            years: filters.years.filter(x => x !== y)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Nível de Escolaridade</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.education_levels.includes(value)) {
                        setFilters({...filters, education_levels: [...filters.education_levels, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental">Fundamental</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="superior">Superior</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.education_levels.map(e => (
                      <Badge key={e} variant="secondary">
                        {e === 'fundamental' ? 'Fundamental' : e === 'medio' ? 'Médio' : 'Superior'}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            education_levels: filters.education_levels.filter(x => x !== e)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assuntos</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!filters.topics.includes(value)) {
                        setFilters({...filters, topics: [...filters.topics, value]});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.topics.map(t => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.topics.map(t => (
                      <Badge key={t} variant="secondary">
                        {t}
                        <button
                          type="button"
                          onClick={() => setFilters({
                            ...filters, 
                            topics: filters.topics.filter(x => x !== t)
                          })}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleSearchQuestions}
                  disabled={searching}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {searching ? "Buscando..." : "Buscar Questões"}
                </Button>

                {searchResults.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleAddAllResults}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Todas ({searchResults.length})
                  </Button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold mb-3">Resultados da Busca</h4>
                  <div className="space-y-2">
                    {searchResults.map(q => (
                      <div
                        key={q.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">
                            {q.statement?.replace(/<[^>]*>/g, '') || 'Questão sem enunciado'}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {availableOptions.subjects.find(s => s.value === q.subject)?.label}
                            </Badge>
                            {q.difficulty && (
                              <Badge className={`text-xs ${getDifficultyColor(q.difficulty)}`}>
                                {q.difficulty === 'facil' ? 'Fácil' : q.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddQuestion(q)}
                          disabled={selectedQuestions.find(sq => sq.id === q.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Questões Selecionadas ({selectedQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma questão adicionada ainda
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {selectedQuestions.map((q, index) => (
                          <Draggable key={q.id} draggableId={q.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                </div>
                                <span className="font-bold text-gray-500 min-w-[30px]">
                                  {index + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-2">
                                    {q.statement?.replace(/<[^>]*>/g, '') || 'Questão sem enunciado'}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {availableOptions.subjects.find(s => s.value === q.subject)?.label}
                                    </Badge>
                                    {q.difficulty && (
                                      <Badge className={`text-xs ${getDifficultyColor(q.difficulty)}`}>
                                        {q.difficulty === 'facil' ? 'Fácil' : q.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                                      </Badge>
                                    )}
                                    {q.user_comment && (
                                      <Badge variant="secondary" className="text-xs">
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        Com comentário
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveQuestion(index, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveQuestion(index, 'down')}
                                    disabled={index === selectedQuestions.length - 1}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setCommentDialog({
                                        open: true,
                                        questionId: q.id,
                                        comment: q.user_comment || ""
                                      });
                                    }}
                                    className="text-blue-600"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveQuestion(q.id)}
                                    className="text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("Notebooks"))}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedQuestions.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : notebookId ? "Atualizar" : "Criar Caderno"}
            </Button>
          </div>
        </form>

        <Dialog open={commentDialog.open} onOpenChange={(open) => setCommentDialog({...commentDialog, open})}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Comentário Pessoal</DialogTitle>
              <DialogDescription>
                Escreva suas anotações sobre esta questão
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={commentDialog.comment}
              onChange={(e) => setCommentDialog({...commentDialog, comment: e.target.value})}
              placeholder="Digite seu comentário..."
              rows={5}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCommentDialog({ open: false, questionId: null, comment: "" })}>
                Cancelar
              </Button>
              <Button onClick={handleSaveComment} className="bg-blue-600 hover:bg-blue-700">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}