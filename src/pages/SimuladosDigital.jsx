import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { Shield, ChevronLeft, ChevronRight, Search, Sun, Moon, Filter, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function QuestionCard({ index, question, selected, onSelect }) {
  const letters = ["a", "b", "c", "d", "e"];
  const correctLetter = (question.correct_answer || "").toLowerCase();
  const isAnswered = selected != null;
  const isCorrect = isAnswered && selected === correctLetter;

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-gray-500 font-semibold w-7 text-right">
            {index}
          </div>
          <div className="flex-1">
            {question.statement && (
              <div
                className="text-gray-900 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: question.statement }}
              />
            )}

            <div className="space-y-2">
              {question.options?.map((opt, i) => {
                const l = (opt.letter || letters[i] || "").toLowerCase();
                const selectedThis = selected === l;
                const isCorrectAlt = correctLetter === l;
                const showRight = isAnswered && isCorrectAlt;
                const showWrong = isAnswered && selectedThis && !isCorrectAlt;

                return (
                  <button
                    key={l + i}
                    onClick={() => onSelect(l)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors
                      ${selectedThis ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}
                      ${showRight ? "border-green-500 bg-green-50" : ""}
                      ${showWrong ? "border-red-500 bg-red-50" : ""}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                        ${showRight ? "bg-green-600 text-white" : showWrong ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
                      >
                        {l.toUpperCase()}
                      </div>
                      <div className="flex-1 text-gray-800">
                        <div dangerouslySetInnerHTML={{ __html: opt.text || "" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {isAnswered && !isCorrect && correctLetter && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                Resposta incorreta. A resposta correta é a alternativa "{correctLetter}".
              </div>
            )}

            {isAnswered && question.explanation && (
              <div
                className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimuladosDigital() {
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [whiteBg, setWhiteBg] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [selectedCargo, setSelectedCargo] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get("page") || "1", 10);
  const [titleState, setTitleState] = useState(urlParams.get("exam_title") || "");
  const [subtitleState, setSubtitleState] = useState(urlParams.get("exam_subtitle") || "");

  const formatCargo = (s) => String(s || "").replace(/_/g, " ").toUpperCase();
  const [roleText, setRoleText] = useState(() => {
    const c = urlParams.get("cargo");
    return c ? formatCargo(c) : "ASSISTENTE ADMINISTRATIVO";
  });

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    return user.email === "conectadoemconcursos@gmail.com" || user.email === "jairochris1@gmail.com" || user.role === "admin";
  }, [user]);

  // Carregar todas as questões
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const me = await base44.auth.me();
        setUser(me || null);

        const list = await base44.entities.SDQuestion.list("-created_date", 200);
        setAllQuestions(list || []);
        setFilteredQuestions(list || []);

        // Aplicar filtros de URL se existirem
        if (urlParams.get("subject")) setSelectedSubject(urlParams.get("subject"));
        if (urlParams.get("institution")) setSelectedInstitution(urlParams.get("institution"));
        if (urlParams.get("cargo")) setSelectedCargo(urlParams.get("cargo"));

        let cargoToUse = urlParams.get("cargo");
        if (!cargoToUse) {
          const cargos = Array.from(new Set((list || []).map(q => q.cargo).filter(Boolean)));
          if (cargos.length === 1) {
            cargoToUse = cargos[0];
          } else if (cargos.length > 1) {
            cargoToUse = "VÁRIOS CARGOS";
          }
        }
        if (cargoToUse) {
          setRoleText(cargoToUse === "VÁRIOS CARGOS" ? cargoToUse : formatCargo(cargoToUse));
        }

        if (!titleState || !subtitleState) {
          const sc = await base44.entities.SiteContent.filter({ page_key: "sd_header" });
          if (sc?.length) {
            if (!titleState) setTitleState(sc[0].title || "");
            if (!subtitleState) setSubtitleState(sc[0].subtitle || "");
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...allQuestions];

    // Busca por texto
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(q => 
        q.statement?.toLowerCase().includes(searchLower) ||
        q.options?.some(opt => opt.text?.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por disciplina
    if (selectedSubject !== "all") {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }

    // Filtro por banca
    if (selectedInstitution !== "all") {
      filtered = filtered.filter(q => q.institution === selectedInstitution);
    }

    // Filtro por cargo
    if (selectedCargo !== "all") {
      filtered = filtered.filter(q => q.cargo === selectedCargo);
    }

    // Filtro por seção
    if (selectedSection !== "all") {
      filtered = filtered.filter(q => q.section === selectedSection);
    }

    setFilteredQuestions(filtered);
  }, [searchText, selectedSubject, selectedInstitution, selectedCargo, selectedSection, allQuestions]);

  const handleSelect = (qid, letter) => {
    setSelected(prev => ({ ...prev, [qid]: letter }));
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedSubject("all");
    setSelectedInstitution("all");
    setSelectedCargo("all");
    setSelectedSection("all");
  };

  // Obter valores únicos para os filtros
  const uniqueSubjects = useMemo(() => 
    Array.from(new Set(allQuestions.map(q => q.subject).filter(Boolean))).sort(),
    [allQuestions]
  );

  const uniqueInstitutions = useMemo(() => 
    Array.from(new Set(allQuestions.map(q => q.institution).filter(Boolean))).sort(),
    [allQuestions]
  );

  const uniqueCargos = useMemo(() => 
    Array.from(new Set(allQuestions.map(q => q.cargo).filter(Boolean))).sort(),
    [allQuestions]
  );

  const uniqueSections = useMemo(() => 
    Array.from(new Set(allQuestions.map(q => q.section).filter(Boolean))).sort(),
    [allQuestions]
  );

  const sectionLabels = {
    conhecimentos_locais: "CONHECIMENTOS LOCAIS",
    conhecimentos_especificos: "CONHECIMENTOS ESPECÍFICOS",
  };

  const activeFiltersCount = [
    searchText.trim() !== "",
    selectedSubject !== "all",
    selectedInstitution !== "all",
    selectedCargo !== "all",
    selectedSection !== "all"
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-800">Carregando simulados...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${whiteBg ? "bg-white" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className={`${whiteBg ? "text-gray-600 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"} px-2 hidden md:flex`}>
              <ArrowLeft className="w-5 h-5" /> Voltar
            </Button>
            <div>
              <h2 className={`${whiteBg ? "text-gray-900" : "text-white"} text-xl md:text-2xl font-extrabold tracking-wide`}>
                {titleState || "SIMULADOS DIGITAL"}
              </h2>
              {subtitleState && (
                <p className={`${whiteBg ? "text-gray-600" : "text-blue-200/90"} text-sm md:text-base`}>{subtitleState}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={whiteBg ? "" : "border-white/40 text-white hover:bg-white/10"}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => setWhiteBg((v) => !v)}
              className={whiteBg ? "" : "border-white/40 text-white hover:bg-white/10"}
              title="Alternar fundo"
            >
              {whiteBg ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
              {whiteBg ? "Fundo original" : "Fundo branco"}
            </Button>
            {isAdmin && (
              <Button
                onClick={() => (window.location.href = createPageUrl("SDAdmin"))}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <div className={`rounded-xl ${whiteBg ? "bg-white text-gray-800 border" : "bg-white/10 text-white border border-white/30"} px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-3`}>
              <div className={`${whiteBg ? "text-gray-500" : "text-white/70"} text-xs`}>PÁGINA</div>
              <div className="text-lg leading-none">{pageParam}</div>
              <div className={`${whiteBg ? "bg-gray-300" : "bg-white/40"} w-px h-5 mx-1`} />
              <div className={`${whiteBg ? "text-gray-600" : "text-white/80"} text-xs`}>{roleText}</div>
            </div>
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtros Avançados</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Limpar Filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Busca por texto */}
                <div className="lg:col-span-3">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Buscar no enunciado
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Digite para buscar..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Disciplina */}
                {uniqueSubjects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Disciplina
                    </label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueSubjects.map(s => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Banca */}
                {uniqueInstitutions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Banca
                    </label>
                    <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueInstitutions.map(i => (
                          <SelectItem key={i} value={i}>{i.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cargo */}
                {uniqueCargos.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Cargo
                    </label>
                    <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueCargos.map(c => (
                          <SelectItem key={c} value={c}>{formatCargo(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Seção */}
                {uniqueSections.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Seção
                    </label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueSections.map(s => (
                          <SelectItem key={s} value={s}>{sectionLabels[s] || s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Tags de filtros ativos */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchText.trim() && (
                    <Badge variant="secondary">
                      Busca: "{searchText}"
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchText("")} />
                    </Badge>
                  )}
                  {selectedSubject !== "all" && (
                    <Badge variant="secondary">
                      Disciplina: {selectedSubject.replace(/_/g, ' ')}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedSubject("all")} />
                    </Badge>
                  )}
                  {selectedInstitution !== "all" && (
                    <Badge variant="secondary">
                      Banca: {selectedInstitution.toUpperCase()}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedInstitution("all")} />
                    </Badge>
                  )}
                  {selectedCargo !== "all" && (
                    <Badge variant="secondary">
                      Cargo: {formatCargo(selectedCargo)}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCargo("all")} />
                    </Badge>
                  )}
                  {selectedSection !== "all" && (
                    <Badge variant="secondary">
                      Seção: {sectionLabels[selectedSection] || selectedSection}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedSection("all")} />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contador de resultados */}
        <div className="mb-4 text-sm text-gray-600">
          Exibindo {filteredQuestions.length} de {allQuestions.length} questões
        </div>

        {/* Navegação */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.max(1, pageParam - 1);
              const next = new URL(window.location.href);
              next.searchParams.set("page", String(newPage));
              window.location.href = next.toString();
            }}
            className={whiteBg ? "" : "border-white/40 text-white hover:bg-white/10"}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const newPage = pageParam + 1;
              const next = new URL(window.location.href);
              next.searchParams.set("page", String(newPage));
              window.location.href = next.toString();
            }}
            className={whiteBg ? "" : "border-white/40 text-white hover:bg-white/10"}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Lista de questões */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-2 text-center text-gray-700 py-12">
              Nenhuma questão encontrada com os filtros aplicados.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx + 1}
                question={q}
                selected={selected[q.id]}
                onSelect={(l) => handleSelect(q.id, l)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}