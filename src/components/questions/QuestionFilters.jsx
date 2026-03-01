import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, BookmarkPlus, Bookmark, X, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { SavedFilter } from "@/entities/SavedFilter";
import { Topic } from "@/entities/Topic";
import { User } from "@/entities/User";
// Question import is no longer needed for dynamic subject fetching, but kept if used elsewhere.
// import { Question } from "@/entities/Question"; 
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from
"@/components/ui/collapsible";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";

// Updated static options
const institutionOptions = [
{ value: "fcc", label: "FCC" },
{ value: "cespe", label: "CESPE/CEBRASPE" },
{ value: "vunesp", label: "VUNESP" },
{ value: "fgv", label: "FGV" },
{ value: "cesgranrio", label: "CESGRANRIO" },
{ value: "esaf", label: "ESAF" },
{ value: "fundatec", label: "FUNDATEC" },
{ value: "consulplan", label: "CONSULPLAN" },
{ value: "idecan", label: "IDECAN" },
{ value: "aocp", label: "AOCP" },
{ value: "quadrix", label: "QUADRIX" },
{ value: "instituto_aocp", label: "Instituto AOCP" },
{ value: "planejar", label: "Planejar" },
{ value: "ibptec", label: "IBPTEC" },
{ value: "amiga_publica", label: "Amiga Pública" },
{ value: "ibade", label: "IBADE" },
{ value: "ibfc", label: "IBFC" },
{ value: "objetiva", label: "Objetiva" },
{ value: "iades", label: "IADES" },
{ value: "itame", label: "ITAME" },
{ value: "outras", label: "Outras" }];


const cargoOptions = [
{ value: "advogado", label: "Advogado" },
{ value: "agente_de_limpeza", label: "Agente de Limpeza" },
{ value: "agente_policia", label: "Agente de Polícia" },
{ value: "agente_policia_federal", label: "Agente de Polícia Federal" },
{ value: "agente_penitenciario", label: "Agente Penitenciário" },
{ value: "analista_bancario", label: "Analista Bancário" },
{ value: "analista_receita_federal", label: "Analista da Receita Federal" },
{ value: "analista_sistemas", label: "Analista de Sistemas" },
{ value: "analista_judiciario", label: "Analista Judiciário" },
{ value: "assistente_administrativo", label: "Assistente Administrativo" },
{ value: "auxiliar_administrativo", label: "Auxiliar Administrativo" },
{ value: "auditor_fiscal", label: "Auditor Fiscal" },
{ value: "contador", label: "Contador" },
{ value: "cuidador_escolar", label: "Cuidador Escolar" },
{ value: "delegado_policia", label: "Delegado de Polícia" },
{ value: "delegado_policia_civil", label: "Delegado de Polícia Civil" },
{ value: "delegado_policia_civil_substituto", label: "Delegado de Polícia Civil Substituto" },
{ value: "delegado_policia_federal", label: "Delegado de Polícia Federal" },
{ value: "delegado_policia_substituto", label: "Delegado de Polícia Substituto" },
{ value: "enfermeiro", label: "Enfermeiro" },
{ value: "engenheiro", label: "Engenheiro" },
{ value: "escrivao_policia_civil", label: "Escrivão de Polícia Civil" },
{ value: "escriturario", label: "Escriturário" },
{ value: "gari", label: "Gari" },
{ value: "guarda_civil_municipal", label: "Guarda Civil Municipal" },
{ value: "guarda_municipal", label: "Guarda Municipal" },
{ value: "medico", label: "Médico" },
{ value: "policial_civil", label: "Policial Civil" },
{ value: "policial_federal", label: "Policial Federal" },
{ value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
{ value: "professor_educacao_infantil_fundamental", label: "Professor de Educação Infantil e Fundamental" },
{ value: "professor_matematica", label: "Professor (Matemática)" },
{ value: "professor_portugues", label: "Professor (Português)" },
{ value: "tecnico_bancario", label: "Técnico Bancário" },
{ value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
{ value: "tecnico_informatica", label: "Técnico em Informática" },
{ value: "tecnico_judiciario", label: "Técnico Judiciário" }];


const yearOptions = [...Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i)].map((y) => ({
  value: y.toString(),
  label: y.toString()
}));

const educationLevelOptions = [
{ value: "fundamental", label: "Fundamental" },
{ value: "medio", label: "Médio" },
{ value: "superior", label: "Superior" }];


const typeOptions = [
{ value: "multiple_choice", label: "Múltipla Escolha" },
{ value: "true_false", label: "Certo/Errado" }];


const difficultyOptions = [
{ value: "facil", label: "Fácil" },
{ value: "medio", label: "Médio" },
{ value: "dificil", label: "Difícil" }];


// Updated static subject options
const subjectOptions = [
{ value: "portugues", label: "Português" },
{ value: "matematica", label: "Matemática" },
{ value: "raciocinio_logico", label: "Raciocínio Lógico" },
{ value: "informatica", label: "Informática" },
{ value: "tecnologia_informacao", label: "Tecnologia da Informação" },
{ value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
{ value: "direito_constitucional", label: "Direito Constitucional" },
{ value: "direito_administrativo", label: "Direito Administrativo" },
{ value: "direito_penal", label: "Direito Penal" },
{ value: "direito_civil", label: "Direito Civil" },
{ value: "direito_tributario", label: "Direito Tributário" },
{ value: "direito_previdenciario", label: "Direito Previdenciário" },
{ value: "direito_eleitoral", label: "Direito Eleitoral" },
{ value: "direito_ambiental", label: "Direito Ambiental" },
{ value: "direito_trabalho", label: "Direito do Trabalho" },
{ value: "direito_processual_penal", label: "Direito Processual Penal" },
{ value: "administracao_geral", label: "Administração Geral" },
{ value: "administracao_publica", label: "Administração Pública" },
{ value: "afo", label: "AFO" },
{ value: "gestao_pessoas", label: "Gestão de Pessoas" },
{ value: "administracao_recursos_materiais", label: "Administração de Recursos Materiais" },
{ value: "arquivologia", label: "Arquivologia" },
{ value: "financas_publicas", label: "Finanças Públicas" },
{ value: "etica_administracao", label: "Ética na Administração" },
{ value: "atendimento_publico", label: "Atendimento ao Público" },
{ value: "comunicacao_social", label: "Comunicação Social" },
{ value: "direitos_humanos", label: "Direitos Humanos" },
{ value: "eca", label: "ECA (Estatuto da Criança e do Adolescente)" },
{ value: "contabilidade", label: "Contabilidade" },
{ value: "economia", label: "Economia" },
{ value: "estatistica", label: "Estatística" },
{ value: "pedagogia", label: "Pedagogia" },
{ value: "educacao_fisica", label: "Educação Física" },
{ value: "ingles", label: "Inglês" },
{ value: "seguranca_publica", label: "Segurança Pública" },
{ value: "lei_8112", label: "Lei 8.112/90" },
{ value: "lei_8666", label: "Lei 8.666/93" },
{ value: "lei_14133", label: "Lei 14.133/21" },
{ value: "constituicao_federal", label: "Constituição Federal" },
{ value: "regimento_interno", label: "Regimento Interno" },
{ value: "legislacao_especifica", label: "Legislação Específica" },
{ value: "legislacao_estadual", label: "Legislação Estadual" },
{ value: "legislacao_municipal", label: "Legislação Municipal" }];



// Componente de Filtro com Checkboxes
const FilterSection = ({ title, options, selectedValues, onSelectionChange, searchable = true, isOpen, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    // Mover a verificação de segurança para dentro do useMemo
    const safeOptions = Array.isArray(options) ? options : [];

    if (!searchQuery || !searchable) return safeOptions;
    return safeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, searchable]);

  const handleCheckboxChange = (value, checked) => {
    if (checked) {
      onSelectionChange([...selectedValues, value]);
    } else {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="w-full relative">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 text-white hover:opacity-90 border-0"
            style={{ backgroundColor: 'var(--primary-color)' }}>

            <span className="text-slate-100 font-medium">{title}</span>
            {selectedValues.length > 0 &&
            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                {selectedValues.length}
              </span>
            }
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {searchable &&
          <div className="p-3 border-b bg-gray-50 dark:bg-gray-700">
              <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm" />

            </div>
          }
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ?
            filteredOptions.map((option) =>
            <div key={option.value} className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Checkbox
                id={`${title}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => handleCheckboxChange(option.value, checked)} />

                  <label
                htmlFor={`${title}-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-gray-900 dark:text-gray-200 font-sans">

                    {option.label}
                  </label>
                </div>
            ) :

            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Nenhum resultado encontrado
              </div>
            }
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>);

};

export default function QuestionFilters({ onFilterSubmit }) {
  const [selectedFilters, setSelectedFilters] = useState({
    subjects: [],
    institutions: [],
    cargos: [],
    years: [],
    educationLevels: [],
    types: [],
    topics: [],
    difficulty: [] // Added difficulty filter
  });
  const [keyword, setKeyword] = useState('');
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMyFiltersOpen, setIsMyFiltersOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  // Removed [subjectOptions, setSubjectOptions] state as it's now a static constant

  // Fetch current user once on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Removed useEffect for dynamic subject fetching, now using static subjectOptions

  // Fetch topics from database on component mount, with sorting
  useEffect(() => {
    const fetchAllTopics = async () => {
      try {
        const allTopicsData = await Topic.list();
        console.log("Topics carregados:", allTopicsData);
        if (allTopicsData && Array.isArray(allTopicsData)) {
          // CORREÇÃO: Remover duplicatas baseado no value + subject
          const uniqueTopics = allTopicsData.reduce((acc, topic) => {
            if (topic && topic.value && topic.label && topic.subject) {// Ensure topic and its properties are valid
              const key = `${topic.subject}-${topic.value}`; // Use subject and value for uniqueness
              if (!acc[key]) {
                acc[key] = {
                  value: topic.value,
                  label: topic.label,
                  subject: topic.subject
                };
              }
            }
            return acc;
          }, {});

          const formatted = Object.values(uniqueTopics).
          sort((a, b) => (a.label || '').localeCompare(b.label || ''));

          console.log("Topics formatados e sem duplicatas:", formatted);
          setAllTopics(formatted);
        } else {
          console.warn("Nenhum topic encontrado ou dados inválidos");
          setAllTopics([]);
        }
      } catch (error) {
        console.error("Erro ao carregar tópicos:", error);
        setAllTopics([]);
      }
    };
    fetchAllTopics();
  }, []);

  // Load saved filters when currentUser is available
  useEffect(() => {
    const fetchSavedFilters = async () => {
      if (currentUser?.email) {
        try {
          const filters = await SavedFilter.filter({ user_email: currentUser.email });
          setSavedFilters(Array.isArray(filters) ? filters : []);
        } catch (error) {
          console.error("Erro ao carregar filtros salvos:", error);
          setSavedFilters([]);
        }
      } else if (currentUser === null) {
        setSavedFilters([]);
      }
    };
    fetchSavedFilters();
  }, [currentUser]);

  // Auto-submit quando filtros mudarem
  useEffect(() => {
    const filters = {
      keyword: keyword,
      subjects: selectedFilters.subjects,
      institutions: selectedFilters.institutions,
      cargos: selectedFilters.cargos,
      years: selectedFilters.years,
      educationLevels: selectedFilters.educationLevels,
      types: selectedFilters.types,
      topics: selectedFilters.topics,
      difficulty: selectedFilters.difficulty // Include difficulty
    };
    console.log("Filtros sendo aplicados:", filters);
    onFilterSubmit(filters);
  }, [selectedFilters, keyword, onFilterSubmit]);

  const handleApplySavedFilter = (filter) => {
    setSelectedFilters({
      subjects: filter.subjects || [],
      institutions: filter.institutions || [],
      cargos: filter.cargos || [],
      years: filter.years || [],
      educationLevels: filter.educationLevels || [],
      types: filter.types || [],
      topics: filter.topics || [],
      difficulty: filter.difficulty || [] // Include difficulty
    });
    setKeyword(filter.keyword || '');
    toast.info(`Filtro "${filter.name}" aplicado.`);
  };

  const confirmDeleteFilter = async () => {
    if (!filterToDelete) return;
    try {
      await SavedFilter.delete(filterToDelete.id);
      toast.success(`Filtro "${filterToDelete.name}" excluído!`);
      // Refactored loading of saved filters to rely on the useEffect that tracks currentUser
      if (currentUser?.email) {
        const filters = await SavedFilter.filter({ user_email: currentUser.email });
        setSavedFilters(Array.isArray(filters) ? filters : []);
      } else {
        setSavedFilters([]);
      }
    } catch (error) {
      console.error("Erro ao excluir filtro:", error);
      toast.error("Erro ao excluir filtro.");
    } finally {
      setFilterToDelete(null); // Close the dialog
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !currentUser?.email) {
      toast.error('Por favor, digite um nome para o filtro e certifique-se de estar logado.');
      return;
    }

    try {
      await SavedFilter.create({
        name: filterName,
        subjects: selectedFilters.subjects,
        institutions: selectedFilters.institutions,
        cargos: selectedFilters.cargos,
        years: selectedFilters.years,
        educationLevels: selectedFilters.educationLevels,
        types: selectedFilters.types,
        topics: selectedFilters.topics,
        difficulty: selectedFilters.difficulty, // Include difficulty
        keyword: keyword,
        user_email: currentUser.email
      });

      setFilterName('');
      setShowSaveInput(false);
      // Refactored loading of saved filters to rely on the useEffect that tracks currentUser
      if (currentUser?.email) {
        const filters = await SavedFilter.filter({ user_email: currentUser.email });
        setSavedFilters(Array.isArray(filters) ? filters : []);
      } else {
        setSavedFilters([]);
      }
      toast.success('Filtro salvo com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar filtro:", error);
      toast.error('Ocorreu um erro ao salvar o filtro.');
    }
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      subjects: [],
      institutions: [],
      cargos: [],
      years: [],
      educationLevels: [],
      types: [],
      topics: [],
      difficulty: [] // Clear difficulty
    });
    setKeyword('');
  };

  const getAllSelectedCount = () => {
    return selectedFilters.subjects.length + selectedFilters.institutions.length +
    selectedFilters.cargos.length + selectedFilters.years.length +
    selectedFilters.educationLevels.length + selectedFilters.types.length +
    selectedFilters.topics.length + selectedFilters.difficulty.length; // Include difficulty
  };

  const handleToggleFilter = (filterTitle) => {
    setOpenFilter((prev) => prev === filterTitle ? null : filterTitle);
  };

  // Memoized topics, filtered by selected subjects
  const filteredTopics = useMemo(() => {
    const safeTopics = Array.isArray(allTopics) ? allTopics : [];
    console.log("Filtrando topics. AllTopics:", safeTopics, "Selected subjects:", selectedFilters.subjects);

    if (selectedFilters.subjects.length === 0) {
      return []; // Não mostra nenhum assunto se nenhuma disciplina foi selecionada
    }
    // Filter topics by selected subjects
    const filtered = safeTopics.filter((topic) =>
    topic && topic.subject && selectedFilters.subjects.includes(topic.subject)
    );
    console.log("Topics filtrados por disciplina:", filtered);
    return filtered;
  }, [allTopics, selectedFilters.subjects]);


  return (
    <div className="space-y-4 mb-6">
      <Card className="shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 text-lg font-semibold dark:text-white">Filtros de Questões</h2>
            {getAllSelectedCount() > 0 &&
            <Badge variant="secondary" className="text-white dark:text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                {getAllSelectedCount()} filtros ativos
              </Badge>
            }
          </div>

          {/* Palavra-chave */}
          <div className="mb-6">
            <label className="text-gray-900 mb-2 text-sm font-medium dark:text-gray-300 block">Pesquisar por palavra-chave

            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Digite para buscar no enunciado ou comando..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-10 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500" />

            </div>
          </div>

          {/* Filtros com Checkboxes - Ajustado com espaçamento para dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10"> {/* Adjusted mb */}
            <FilterSection
              title="Disciplina"
              options={subjectOptions} // Using static subjectOptions
              selectedValues={selectedFilters.subjects}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, subjects: values }))}
              isOpen={openFilter === 'Disciplina'}
              onToggle={() => handleToggleFilter('Disciplina')} />


            <FilterSection
              title="Banca"
              options={institutionOptions}
              selectedValues={selectedFilters.institutions}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, institutions: values }))}
              isOpen={openFilter === 'Banca'}
              onToggle={() => handleToggleFilter('Banca')} />


            <FilterSection
              title="Cargo"
              options={cargoOptions}
              selectedValues={selectedFilters.cargos}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, cargos: values }))}
              isOpen={openFilter === 'Cargo'}
              onToggle={() => handleToggleFilter('Cargo')} />


            <FilterSection
              title="Ano"
              options={yearOptions}
              selectedValues={selectedFilters.years}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, years: values }))}
              searchable={false}
              isOpen={openFilter === 'Ano'}
              onToggle={() => handleToggleFilter('Ano')} />


            <FilterSection
              title="Escolaridade"
              options={educationLevelOptions}
              selectedValues={selectedFilters.educationLevels}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, educationLevels: values }))}
              searchable={false}
              isOpen={openFilter === 'Escolaridade'}
              onToggle={() => handleToggleFilter('Escolaridade')} />


            <FilterSection
              title="Modalidade"
              options={typeOptions}
              selectedValues={selectedFilters.types}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, types: values }))}
              searchable={false}
              isOpen={openFilter === 'Modalidade'}
              onToggle={() => handleToggleFilter('Modalidade')} />


            <FilterSection
              title="Dificuldade"
              options={difficultyOptions}
              selectedValues={selectedFilters.difficulty}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, difficulty: values }))}
              searchable={false}
              isOpen={openFilter === 'Dificuldade'}
              onToggle={() => handleToggleFilter('Dificuldade')} />


            <FilterSection
              title="Assunto"
              options={filteredTopics}
              selectedValues={selectedFilters.topics}
              onSelectionChange={(values) => setSelectedFilters((prev) => ({ ...prev, topics: values }))}
              isOpen={openFilter === 'Assunto'}
              onToggle={() => handleToggleFilter('Assunto')} />

          </div>

          {/* Tags selecionadas */}
          {getAllSelectedCount() > 0 &&
          <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros Selecionados:</h4>
                <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">

                  Limpar todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Subjects */}
                {selectedFilters.subjects.map((subject) => {
                const option = subjectOptions.find((opt) => opt.value === subject);
                return (
                  <Badge key={subject} className="bg-blue-100 text-blue-800 pr-1 dark:bg-blue-900 dark:text-blue-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        subjects: prev.subjects.filter((s) => s !== subject)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Institutions */}
                {selectedFilters.institutions.map((institution) => {
                const option = institutionOptions.find((opt) => opt.value === institution);
                return (
                  <Badge key={institution} className="bg-purple-100 text-purple-800 pr-1 dark:bg-purple-900 dark:text-purple-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        institutions: prev.institutions.filter((i) => i !== institution)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Cargos */}
                {selectedFilters.cargos.map((cargo) => {
                const option = cargoOptions.find((opt) => opt.value === cargo);
                return (
                  <Badge key={cargo} className="bg-pink-100 text-pink-800 pr-1 dark:bg-pink-900 dark:text-pink-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        cargos: prev.cargos.filter((c) => c !== cargo)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Years */}
                {selectedFilters.years.map((year) =>
              <Badge key={year} className="bg-indigo-100 text-indigo-800 pr-1 dark:bg-indigo-900 dark:text-indigo-200">
                    {year}
                    <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setSelectedFilters((prev) => ({
                    ...prev,
                    years: prev.years.filter((y) => y !== year)
                  }))}>

                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
              )}

                {/* Education Levels */}
                {selectedFilters.educationLevels.map((level) => {
                const option = educationLevelOptions.find((opt) => opt.value === level);
                return (
                  <Badge key={level} className="bg-green-100 text-green-800 pr-1 dark:bg-green-900 dark:text-green-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        educationLevels: prev.educationLevels.filter((e) => e !== level)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Types */}
                {selectedFilters.types.map((type) => {
                const option = typeOptions.find((opt) => opt.value === type);
                return (
                  <Badge key={type} className="bg-orange-100 text-orange-800 pr-1 dark:bg-orange-900 dark:text-orange-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        types: prev.types.filter((t) => t !== type)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Difficulty */}
                {selectedFilters.difficulty.map((difficulty) => {
                const option = difficultyOptions.find((opt) => opt.value === difficulty);
                return (
                  <Badge key={difficulty} className="bg-yellow-100 text-yellow-800 pr-1 dark:bg-yellow-900 dark:text-yellow-200">
                      {option?.label}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        difficulty: prev.difficulty.filter((d) => d !== difficulty)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}

                {/* Topics */}
                {Array.isArray(selectedFilters.topics) && selectedFilters.topics.map((topicValue) => {
                const option = Array.isArray(allTopics) ? allTopics.find((opt) => opt.value === topicValue) : null; // Find from allTopics
                return (
                  <Badge key={topicValue} className="bg-teal-100 text-teal-800 pr-1 dark:bg-teal-900 dark:text-teal-200">
                      {option?.label || topicValue}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => setSelectedFilters((prev) => ({
                        ...prev,
                        topics: prev.topics.filter((t) => t !== topicValue)
                      }))}>

                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>);

              })}
              </div>
            </div>
          }

          {/* Botões de ação - agora dentro do card de filtros */}
          <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            {!showSaveInput ?
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveInput(true)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-white dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600">

                <BookmarkPlus className="w-4 h-4 mr-2" />
                Salvar Filtro Atual
              </Button> :

            <div className="flex gap-2 items-center">
                <Input
                placeholder="Nome do filtro"
                value={filterName}
                onChange={(e) => e.target.value.length <= 50 && setFilterName(e.target.value)}
                className="w-40 bg-white text-gray-900 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveFilter()}
                maxLength={50} />

                <Button size="sm" onClick={handleSaveFilter} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowSaveInput(false);
                  setFilterName('');
                }}
                className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600">

                   Cancelar
                 </Button>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Card de Filtros Salvos */}
      <Collapsible open={isMyFiltersOpen} onOpenChange={setIsMyFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 text-white hover:opacity-90 border-0 rounded-lg"
            style={{ backgroundColor: 'var(--primary-color)' }}>

            <span className="font-medium flex items-center gap-2">
              <Bookmark className="w-4 h-4" /> Meus Filtros Salvos
            </span>
            <div className="flex items-center gap-2">
              {savedFilters.length > 0 &&
              <span className="ml-2 px-2 py-1 text-white text-xs rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}>
                  {savedFilters.length}
                </span>
              }
              {isMyFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border border-t-0 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-b-lg">
          {savedFilters.length > 0 ?
          <div className="p-4 space-y-2">
              {savedFilters.map((filter) =>
            <div key={filter.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{filter.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="default" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--primary-color)' }} onClick={() => handleApplySavedFilter(filter)}>Aplicar</Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => setFilterToDelete(filter)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
            )}
            </div> :

          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Você ainda não salvou nenhum filtro. Use o botão "Salvar Filtro Atual" para começar.
            </p>
          }
        </CollapsibleContent>
      </Collapsible>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!filterToDelete} onOpenChange={(open) => !open && setFilterToDelete(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Excluir Filtro</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              Tem certeza que deseja excluir o filtro "{filterToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFilter} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}