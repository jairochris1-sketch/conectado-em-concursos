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
import { ArrowLeft, Save, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";

export default function CreateNotebook() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const notebookId = urlParams.get('id');

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "private"
  });

  const [filters, setFilters] = useState({
    subjects: [],
    topics: [],
    institutions: [],
    years: [],
    cargos: []
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

  useEffect(() => {
    loadOptions();
    if (notebookId) {
      loadNotebook();
    }
  }, [notebookId]);

  const loadOptions = async () => {
    try {
      const [subjects, institutions, questions] = await Promise.all([
        base44.entities.Subject.list(),
        base44.entities.Institution.list(),
        base44.entities.Question.list()
      ]);

      const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);
      const cargos = [...new Set(questions.map(q => q.cargo).filter(Boolean))].sort();

      setAvailableOptions({
        subjects: subjects || [],
        institutions: institutions || [],
        years,
        cargos
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
        type: notebook.type
      });

      if (notebook.filters) {
        setFilters(notebook.filters);
      }

      const notebookQuestions = await base44.entities.NotebookQuestion.filter({ 
        notebook_id: notebookId 
      });

      const questionIds = notebookQuestions.map(q => q.question_id);
      const questions = await Promise.all(
        questionIds.map(id => base44.entities.Question.get(id))
      );

      setSelectedQuestions(questions);
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
      setSelectedQuestions([...selectedQuestions, question]);
      toast.success("Questão adicionada");
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const handleAddAllResults = () => {
    const newQuestions = searchResults.filter(
      result => !selectedQuestions.find(q => q.id === result.id)
    );
    setSelectedQuestions([...selectedQuestions, ...newQuestions]);
    toast.success(`${newQuestions.length} questões adicionadas`);
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

        // Deletar questões antigas
        const oldQuestions = await base44.entities.NotebookQuestion.filter({ 
          notebook_id: notebookId 
        });
        await Promise.all(oldQuestions.map(q => 
          base44.entities.NotebookQuestion.delete(q.id)
        ));
      } else {
        notebook = await base44.entities.Notebook.create(notebookData);
      }

      // Adicionar questões
      await Promise.all(
        selectedQuestions.map((q, index) => 
          base44.entities.NotebookQuestion.create({
            notebook_id: notebook.id,
            question_id: q.id,
            order: index + 1
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
              <CardTitle>Adicionar Questões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Selecione disciplinas" />
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
                      <SelectValue placeholder="Selecione bancas" />
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
              </div>

              <div className="flex gap-3">
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
                            <Badge variant="outline" className="text-xs">
                              {availableOptions.institutions.find(i => i.id === q.institution)?.name}
                            </Badge>
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
                <div className="space-y-2">
                  {selectedQuestions.map((q, index) => (
                    <div
                      key={q.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
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
                            <Badge variant="outline" className="text-xs">
                              {availableOptions.institutions.find(i => i.id === q.institution)?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
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
                  ))}
                </div>
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
      </div>
    </div>
  );
}