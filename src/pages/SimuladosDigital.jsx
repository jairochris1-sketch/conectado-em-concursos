
// Substitui para usar SDQuestion e renderizar HTML corretamente
import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Sun, Moon } from "lucide-react"; // NEW: Add Sun and Moon icons

function QuestionCard({ index, question, selected, onSelect }) {
  const letters = ["a", "b", "c", "d", "e"]; // Changed from lettersFallback
  const correctLetter = (question.correct_answer || "").toLowerCase();
  const isAnswered = selected != null;
  const isCorrect = isAnswered && selected === correctLetter;

  // The stripHtml helper is removed as alternatives now preserve HTML

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Removido o círculo da numeração */}
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

            {/* Alternativas com HTML preservado e novo layout */}
            <div className="space-y-2">
              {question.options?.map((opt, i) => {
                const l = (opt.letter || letters[i] || "").toLowerCase(); // Use 'letters' array
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
                    // Removed role, tabIndex, onKeyDown as <button> handles these natively
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                        ${showRight ? "bg-green-600 text-white" : showWrong ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
                      >
                        {l.toUpperCase()} {/* Display letter in uppercase */}
                      </div>
                      <div className="flex-1 text-gray-800">
                        <div dangerouslySetInnerHTML={{ __html: opt.text || "" }} /> {/* Preserve HTML */}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {isAnswered && !isCorrect && correctLetter && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                Resposta incorreta. A resposta correta é a alternativa “{correctLetter}”.
              </div>
            )}

            {/* Explicação */}
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
  const [questions, setQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [whiteBg, setWhiteBg] = useState(true); // NEW: toggle de fundo

  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get("page") || "1", 10);
  const [titleState, setTitleState] = useState(urlParams.get("exam_title") || "");
  const [subtitleState, setSubtitleState] = useState(urlParams.get("exam_subtitle") || "");

  // NEW: normaliza o cargo para exibição
  const formatCargo = (s) => String(s || "").replace(/_/g, " ").toUpperCase();
  const [roleText, setRoleText] = useState(() => {
    const c = urlParams.get("cargo");
    return c ? formatCargo(c) : "ASSISTENTE ADMINISTRATIVO";
  });

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    return user.email === "conectadoemconcursos@gmail.com" || user.email === "jairochris1@gmail.com" || user.role === "admin";
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const me = await base44.auth.me();
        setUser(me || null);

        const filters = {};
        if (urlParams.get("subject")) filters.subject = urlParams.get("subject");
        if (urlParams.get("institution")) filters.institution = urlParams.get("institution");
        if (urlParams.get("cargo")) filters.cargo = urlParams.get("cargo");

        const list = Object.keys(filters).length > 0
          ? await base44.entities.SDQuestion.filter(filters, "-created_date", 60)
          : await base44.entities.SDQuestion.list("-created_date", 60);

        setQuestions(list || []);

        // NEW: Define o cargo exibido: URL > único cargo das questões > vários cargos
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

  const handleSelect = (qid, letter) => {
    setSelected(prev => ({ ...prev, [qid]: letter }));
  };

  // SECTION labels
  const sectionLabels = {
    conhecimentos_locais: "CONHECIMENTOS LOCAIS",
    conhecimentos_especificos: "CONHECIMENTOS ESPECÍFICOS",
  };

  const existingSections = Array.from(new Set((questions || []).map(q => q.section).filter(Boolean)));
  const orderedSections = ['conhecimentos_locais', 'conhecimentos_especificos'].filter(s => existingSections.includes(s));
  const hasTwoSections = orderedSections.length === 2;

  // Split questions by section if both exist
  const leftSection = hasTwoSections ? orderedSections[0] : null;
  const rightSection = hasTwoSections ? orderedSections[1] : null;
  const leftQuestions = hasTwoSections ? questions.filter(q => q.section === leftSection) : [];
  const rightQuestions = hasTwoSections ? questions.filter(q => q.section === rightSection) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white"> {/* Changed background color */}
        <div className="text-gray-800">Carregando simulados...</div> {/* Changed text color */}
      </div>
    );
  }

  // Troca de fundo com botão
  return (
    <div className={`min-h-screen ${whiteBg ? "bg-white" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`${whiteBg ? "text-gray-900" : "text-white"} text-xl md:text-2xl font-extrabold tracking-wide`}>
              {titleState || "SIMULADOS DIGITAL"}
            </h2>
            {subtitleState && (
              <p className={`${whiteBg ? "text-gray-600" : "text-blue-200/90"} text-sm md:text-base`}>{subtitleState}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
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
                Painel Admin (Simulados)
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

        {hasTwoSections && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="rounded-xl bg-white text-gray-800 px-4 py-3 text-center font-semibold uppercase shadow-sm">
              {sectionLabels[leftSection]}
            </div>
            <div className="rounded-xl bg-white text-gray-800 px-4 py-3 text-center font-semibold uppercase shadow-sm">
              {sectionLabels[rightSection]}
            </div>
          </div>
        )}

        {hasTwoSections ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {leftQuestions.length === 0 ? (
                <div className="text-center text-gray-700 col-span-1">Sem questões nessa seção.</div> // Adjusted text color
              ) : (
                leftQuestions.map((q, idx) => (
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
            <div className="space-y-6">
              {rightQuestions.length === 0 ? (
                <div className="text-center text-gray-700 col-span-1">Sem questões nessa seção.</div> // Adjusted text color
              ) : (
                rightQuestions.map((q, idx) => (
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.length === 0 ? (
              <div className="col-span-2 text-center text-gray-700">Nenhuma questão cadastrada ainda.</div> // Adjusted text color
            ) : (
              questions.map((q, idx) => (
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
        )}

        <div className={`mt-8 text-center text-xs ${whiteBg ? "text-gray-500" : "text-white/70"}`}>
          Utilize os filtros por URL (subject, institution, cargo) para ajustar o conteúdo exibido.
        </div>
      </div>
    </div>
  );
}
