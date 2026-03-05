import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import FlashcardLibrary from "../components/flashcards/FlashcardLibrary";
import FlashcardReviewer from "../components/flashcards/FlashcardReviewer";
import FlashcardCreator from "../components/flashcards/FlashcardCreator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Library, PlusCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [reviewsDue, setReviewsDue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const allCards = await base44.entities.Flashcard.filter({ created_by: user.email });
      setFlashcards(allCards);

      const reviews = await base44.entities.FlashcardReview.filter({ created_by: user.email });
      
      const due = allCards.filter(card => {
        if (!card.is_active) return false;
        
        const cardReviews = reviews.filter(r => r.flashcard_id === card.id);
        if (cardReviews.length === 0) return true; // never reviewed
        
        // get latest review
        const latestReview = cardReviews.sort((a,b) => new Date(b.created_date) - new Date(a.created_date))[0];
        
        return new Date(latestReview.next_review_date) <= new Date();
      });
      
      setReviewsDue(due);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando flashcards...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-start gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-600" />
            Meus Flashcards
          </h1>
          <p className="text-gray-500 mt-2">Revise conceitos importantes e fixe seu aprendizado usando os flashcards gerados a partir de seus erros.</p>
        </div>
      </div>

      <Tabs defaultValue="review">
        <TabsList className="mb-6">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Revisão Diária ({reviewsDue.length})
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            Biblioteca ({flashcards.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Criar Novo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <FlashcardReviewer cardsDue={reviewsDue} onReviewComplete={loadData} />
        </TabsContent>
        <TabsContent value="library">
          <FlashcardLibrary flashcards={flashcards} onUpdate={loadData} />
        </TabsContent>
        <TabsContent value="create">
          <FlashcardCreator onCreated={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}