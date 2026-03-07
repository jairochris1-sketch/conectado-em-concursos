import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Play, Check, X, RotateCcw } from "lucide-react";
import FlashcardForm from "../components/flashcards/FlashcardForm";

export default function Flashcards() {
  const [active, setActive] = useState("create"); // review | library | create
  const [user, setUser] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        // Auto-gerar flashcards a partir de erros recentes
        await autoGenerateFromMistakes(u);
        const [cards, revs] = await Promise.all([
          base44.entities.Flashcard.filter({ created_by: u.email }, "-created_date", 500),
          base44.entities.FlashcardReview.filter({ created_by: u.email }, "-created_date", 1000)
        ]);
        setMyCards(cards);
        setReviews(revs);
        computeDue(cards, revs);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const libraryCount = myCards.length;
  const reviewCount = dueCards.length;

  const reload = async () => {
    if (!user) return;
    const [cards, revs] = await Promise.all([
      base44.entities.Flashcard.filter({ created_by: user.email }, "-created_date", 500),
      base44.entities.FlashcardReview.filter({ created_by: user.email }, "-created_date", 1000)
    ]);
    setMyCards(cards);
    setReviews(revs);
    computeDue(cards, revs);
  };

  const computeDue = (cards, revs) => {
    const latest = new Map();
    for (const r of revs) {
      const prev = latest.get(r.flashcard_id);
      if (!prev || new Date(r.created_date) > new Date(prev.created_date)) latest.set(r.flashcard_id, r);
    }
    const today = new Date(); today.setHours(0,0,0,0);
    const due = cards.filter(c => {
      const r = latest.get(c.id);
      if (!r) return true;
      if (!r.next_review_date) return true;
      return new Date(r.next_review_date) <= today;
    });
    setDueCards(due);
    setCurrentIdx(0);
    setShowBack(false);
    if (due.length > 0) setActive('review');
  };

  const autoGenerateFromMistakes = async (u) => {
    try {
      const wrong = await base44.entities.ResponseHistory.filter({ created_by: u.email, is_correct: false }, "-created_date", 5);
      if (wrong.length === 0) return;
      const existing = await base44.entities.Flashcard.filter({ created_by: u.email }, "-created_date", 1000);
      const haveTag = new Set();
      for (const c of existing) {
        if (Array.isArray(c.tags)) c.tags.forEach(t => { if (typeof t === 'string' && t.startsWith('qid:')) haveTag.add(t); });
      }
      const toCreate = [];
      for (const w of wrong) {
        const tag = `qid:${w.question_id}`;
        if (haveTag.has(tag)) continue;
        // Buscar questão
        const qArr = await base44.entities.Question.filter({ id: w.question_id }, undefined, 1);
        const q = qArr?.[0];
        if (!q) continue;
        const subject = q.subject || 'conhecimentos_gerais';
        const front = `${q.statement || ''}${q.command ? '<br/><em>' + q.command + '</em>' : ''}`.trim();
        const back = q.explanation || `Gabarito: <strong>${q.correct_answer || ''}</strong>`;
        toCreate.push({
          subject,
          topic: q.topic || undefined,
          front,
          back,
          difficulty: 'medio',
          deck_name: 'Erros Recentes',
          tags: [tag, q.institution || ''],
          is_active: true
        });
        if (toCreate.length >= 3) break; // limita criação inicial
      }
      if (toCreate.length > 0) {
        await base44.entities.Flashcard.bulkCreate(toCreate);
      }
    } catch (e) {
      // silencioso
    }
  };

  const handleGrade = async (quality) => {
    if (!dueCards[currentIdx]) return;
    const card = dueCards[currentIdx];
    // pegar último review do card
    const cardReviews = reviews.filter(r => r.flashcard_id === card.id).sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
    let ef = cardReviews[0]?.easiness_factor ?? 2.5;
    let reps = cardReviews[0]?.repetitions ?? 0;
    let interval = cardReviews[0]?.interval ?? 0;

    if (quality < 2) {
      reps = 0;
      interval = 1;
    } else if (reps === 0) {
      reps = 1;
      interval = 1;
    } else if (reps === 1) {
      reps = 2;
      interval = 6;
    } else {
      reps = reps + 1;
      interval = Math.max(1, Math.round(interval * ef));
    }

    ef = ef + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    const next = new Date();
    next.setDate(next.getDate() + interval);

    await base44.entities.FlashcardReview.create({
      flashcard_id: card.id,
      quality,
      easiness_factor: ef,
      interval,
      repetitions: reps,
      next_review_date: next.toISOString(),
      review_time_seconds: 0
    });

    // atualizar estado
    const newReviews = [
      {
        flashcard_id: card.id,
        quality,
        easiness_factor: ef,
        interval,
        repetitions: reps,
        next_review_date: next.toISOString(),
        created_date: new Date().toISOString()
      },
      ...reviews
    ];
    setReviews(newReviews);
    computeDue(myCards, newReviews);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()} aria-label="Voltar">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meus Flashcards</h1>
            </div>
          </div>
        </div>
        <p className="text-gray-600">Revise conceitos importantes e fixe seu aprendizado usando os flashcards gerados a partir dos seus erros.</p>

        <div className="flex items-center gap-2">
          <Button variant={active === "review" ? "default" : "outline"} onClick={() => setActive("review")}>Revisão Diária ({reviewCount})</Button>
          <Button variant={active === "library" ? "default" : "outline"} onClick={() => setActive("library")}>Biblioteca ({libraryCount})</Button>
          <Button variant={active === "create" ? "default" : "outline"} onClick={() => setActive("create")}>Criar Novo</Button>
        </div>

        {active === "create" && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Novo Flashcard</CardTitle>
            </CardHeader>
            <CardContent>
              <FlashcardForm onSaved={reload} />
            </CardContent>
          </Card>
        )}

        {active === "library" && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Minha Biblioteca</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : myCards.length === 0 ? (
                <p className="text-gray-600">Você ainda não criou flashcards.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myCards.map((c) => (
                    <div key={c.id} className="rounded-lg border border-gray-200 p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">{(c.subject || "").replace(/_/g, " ")}</Badge>
                        {c.deck_name && <span className="text-xs text-gray-500">{c.deck_name}</span>}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-900 font-medium mb-2" dangerouslySetInnerHTML={{ __html: c.front || "" }} />
                        <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: c.back || "" }} />
                      </div>
                      {Array.isArray(c.tags) && c.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {c.tags.map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {active === "review" && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Revisão Diária</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : dueCards.length === 0 ? (
                <div className="text-center text-gray-600">Sem cartões para revisar hoje.</div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="rounded-lg border border-gray-200 p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="capitalize">{(dueCards[currentIdx]?.subject || '').replace(/_/g, ' ')}</Badge>
                      <span className="text-xs text-gray-500">{currentIdx + 1} / {dueCards.length}</span>
                    </div>
                    <div className="prose max-w-none min-h-[120px]">
                      {!showBack ? (
                        <div dangerouslySetInnerHTML={{ __html: dueCards[currentIdx]?.front || '' }} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: dueCards[currentIdx]?.back || '' }} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => setShowBack(!showBack)} className="gap-2">
                      {!showBack ? <Play className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                      {!showBack ? 'Mostrar Resposta' : 'Ver Frente'}
                    </Button>
                    {showBack && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" onClick={() => handleGrade(0)}>Again</Button>
                        <Button variant="outline" onClick={() => handleGrade(1)}>Hard</Button>
                        <Button onClick={() => handleGrade(2)}>Good</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleGrade(3)}>Easy</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}