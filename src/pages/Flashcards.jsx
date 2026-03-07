import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain } from "lucide-react";
import FlashcardForm from "../components/flashcards/FlashcardForm";

export default function Flashcards() {
  const [active, setActive] = useState("create"); // review | library | create
  const [user, setUser] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const list = await base44.entities.Flashcard.filter({ created_by: u.email }, "-created_date", 500);
        setMyCards(list);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const libraryCount = myCards.length;
  const reviewCount = 0; // lógica de revisão será adicionada futuramente

  const reload = async () => {
    if (!user) return;
    const list = await base44.entities.Flashcard.filter({ created_by: user.email }, "-created_date", 500);
    setMyCards(list);
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
              <p className="text-gray-600">Sem cartões para revisar hoje.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}