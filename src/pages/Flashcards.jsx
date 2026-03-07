import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, PlusCircle, Sparkles } from "lucide-react";

function formatDateTime(dtStr) {
  if (!dtStr) return "";
  const d = new Date(dtStr);
  if (isNaN(d)) return "";
  return d.toLocaleString("pt-BR");
}

export default function Flashcards() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  // UI
  const [activeTab, setActiveTab] = useState("review");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const u = await base44.auth.me();
        setUser(u);
        // Carregar flashcards do usuário
        const myCards = await base44.entities.Flashcard.filter({ created_by: u.email }, "-created_date", 1000);
        setCards(myCards);
        // Carregar reviews do usuário
        const myReviews = await base44.entities.FlashcardReview.filter({ created_by: u.email }, "-created_date", 20000);
        setReviews(myReviews);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subjectsList = useMemo(() => {
    const s = Array.from(new Set(cards.map((c) => c.subject).filter(Boolean)));
    return s.sort((a, b) => a.localeCompare(b));
  }, [cards]);

  // Obter último review por flashcard
  const lastReviewByCard = useMemo(() => {
    const map = new Map();
    for (const r of reviews) {
      const prev = map.get(r.flashcard_id);
      if (!prev) map.set(r.flashcard_id, r);
      else {
        const a = new Date(prev.next_review_date || prev.created_date).getTime();
        const b = new Date(r.next_review_date || r.created_date).getTime();
        if (b >= a) map.set(r.flashcard_id, r);
      }
    }
    return map;
  }, [reviews]);

  // Cartas vencidas (ou nunca revisadas)
  const dueCards = useMemo(() => {
    const now = Date.now();
    return cards.filter((c) => {
      const last = lastReviewByCard.get(c.id);
      if (!last) return true; // nunca revisada: revisar agora
      const next = new Date(last.next_review_date || last.created_date).getTime();
      return next <= now;
    });
  }, [cards, lastReviewByCard]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      (c.front || "").toLowerCase().includes(q) ||
      (c.back || "").toLowerCase().includes(q) ||
      (c.subject || "").toLowerCase().includes(q) ||
      (c.topic || "").toLowerCase().includes(q)
    );
  }, [cards, search]);

  const currentDue = dueCards[0] || null;
  const currentLast = currentDue ? lastReviewByCard.get(currentDue.id) : null;

  const createCard = async () => {
    if (!front.trim() || !back.trim() || !subject.trim()) return;
    const data = { front: front.trim(), back: back.trim(), subject: subject.trim() };
    if (topic.trim()) data.topic = topic.trim();
    const c = await base44.entities.Flashcard.create(data);
    setCards((prev) => [c, ...prev]);
    setFront(""); setBack(""); setSubject(""); setTopic("");
    setActiveTab("library");
  };

  // Algoritmo SM-2 básico (qualidade: 0=Again, 1=Hard, 2=Good, 3=Easy)
  const applySM2 = (last) => {
    const quality = last.quality;
    const prevEF = typeof last.easiness_factor === "number" ? last.easiness_factor : 2.5;
    const prevReps = typeof last.repetitions === "number" ? last.repetitions : 0;
    const prevInterval = typeof last.interval === "number" ? last.interval : 0;

    let EF = prevEF;
    // Atualiza EF
    EF = EF + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (EF < 1.3) EF = 1.3;

    let repetitions = prevReps;
    let interval = prevInterval;

    if (quality < 2) {
      repetitions = 0;
      interval = 1; // repete amanhã
    } else {
      repetitions = prevReps + 1;
      if (repetitions === 1) interval = 1; // 1 dia
      else if (repetitions === 2) interval = 6; // 6 dias
      else interval = Math.round(prevInterval * EF);
    }

    const next = new Date();
    next.setDate(next.getDate() + Math.max(1, interval));

    return {
      easiness_factor: EF,
      repetitions,
      interval,
      next_review_date: next.toISOString(),
    };
  };

  const reviewCard = async (flashcard, quality) => {
    if (!flashcard) return;
    const last = currentLast || {
      flashcard_id: flashcard.id,
      quality,
      easiness_factor: 2.5,
      interval: 0,
      repetitions: 0,
      next_review_date: new Date().toISOString(),
    };
    const baseData = { ...last, quality };
    const updated = applySM2(baseData);

    const rec = await base44.entities.FlashcardReview.create({
      flashcard_id: flashcard.id,
      quality,
      easiness_factor: updated.easiness_factor,
      interval: updated.interval,
      repetitions: updated.repetitions,
      next_review_date: updated.next_review_date,
      review_time_seconds: 0,
    });

    setReviews((prev) => [rec, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()} aria-label="Voltar">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Flashcards</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">Cartas: {cards.length}</Badge>
            <Badge variant="outline">Vencidas: {dueCards.length}</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="review" className="gap-2"><BookOpen className="w-4 h-4"/> Revisar</TabsTrigger>
            <TabsTrigger value="create" className="gap-2"><PlusCircle className="w-4 h-4"/> Criar</TabsTrigger>
            <TabsTrigger value="library" className="gap-2"><Sparkles className="w-4 h-4"/> Biblioteca</TabsTrigger>
          </TabsList>

          {/* Revisão */}
          <TabsContent value="review" className="mt-4">
            {currentDue ? (
              <Card className="border border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Revisão</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline">Assunto: {currentDue.subject || "-"}</Badge>
                      {currentDue.topic && <Badge variant="outline">Tópico: {currentDue.topic}</Badge>}
                      {currentLast?.next_review_date && (
                        <span className="hidden md:inline">Próxima sugestão: {formatDateTime(currentLast.next_review_date)}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-md bg-gray-50 border text-gray-900">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Frente</div>
                    <div className="text-lg whitespace-pre-wrap">{currentDue.front}</div>
                  </div>

                  <details className="rounded-md border bg-white">
                    <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Mostrar resposta</summary>
                    <div className="px-4 pb-4 pt-2 text-gray-800 whitespace-pre-wrap">{currentDue.back}</div>
                  </details>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" onClick={() => reviewCard(currentDue, 0)}>Again</Button>
                    <Button variant="outline" onClick={() => reviewCard(currentDue, 1)}>Hard</Button>
                    <Button onClick={() => reviewCard(currentDue, 2)}>Good</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => reviewCard(currentDue, 3)}>Easy</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-700">Nenhuma carta para revisar agora.</p>
                  <p className="text-sm text-gray-500 mt-1">Volte mais tarde ou crie novas cartas.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Criar */}
          <TabsContent value="create" className="mt-4">
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>Criar Flashcard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} list="subjects-list" placeholder="Ex.: Português" />
                    <datalist id="subjects-list">
                      {subjectsList.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tópico (opcional)</label>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex.: Crase" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frente</label>
                  <Textarea rows={4} value={front} onChange={(e) => setFront(e.target.value)} placeholder="Pergunta, termo ou conceito" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verso</label>
                  <Textarea rows={6} value={back} onChange={(e) => setBack(e.target.value)} placeholder="Resposta, definição ou explicação" />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={createCard}>
                    <PlusCircle className="w-4 h-4 mr-2" />Salvar flashcard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biblioteca */}
          <TabsContent value="library" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <Input
                placeholder="Buscar por texto, assunto ou tópico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Badge variant="outline">Total: {filteredCards.length}</Badge>
              </div>
            </div>

            <div className="grid gap-3">
              {filteredCards.length === 0 ? (
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="py-12 text-center text-gray-700">Nenhum flashcard encontrado.</CardContent>
                </Card>
              ) : (
                filteredCards.map((c) => {
                  const r = lastReviewByCard.get(c.id);
                  const due = !r || new Date(r.next_review_date || r.created_date).getTime() <= Date.now();
                  return (
                    <Card key={c.id} className="border border-gray-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500 mb-1">{c.subject}{c.topic ? ` • ${c.topic}` : ""}</div>
                            <div className="font-medium text-gray-900 whitespace-pre-wrap">{c.front}</div>
                            <div className="text-gray-700 mt-2 whitespace-pre-wrap">{c.back}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-xs text-gray-600">
                            {r ? (
                              <>
                                <Badge variant="outline">EF {Number(r.easiness_factor || 2.5).toFixed(2)}</Badge>
                                <span>Próxima: {formatDateTime(r.next_review_date)}</span>
                              </>
                            ) : (
                              <span className="text-gray-500">Ainda não revisado</span>
                            )}
                            {due && <Badge className="mt-1 bg-amber-100 text-amber-800" variant="secondary">Vencido</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}