import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { toast } from "sonner";

export default function ArticleFeedback({ articleId, articleTitle, darkMode = false }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isHelpful, setIsHelpful] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação em estrelas");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.ArticleFeedback.create({
        article_id: articleId,
        article_title: articleTitle,
        user_name: user.full_name || "Usuário",
        user_email: user.email,
        rating: rating,
        comment: comment.trim() || null,
        suggestion: suggestion.trim() || null,
        is_helpful: isHelpful,
        status: "pendente"
      });

      // Criar notificação para o admin
      await base44.entities.Notification.create({
        title: "Novo Feedback de Artigo",
        message: `${user.full_name || "Usuário"} avaliou "${articleTitle}" com ${rating} estrelas`,
        type: "info",
        is_global: false,
        target_users: ["conectadoemconcursos@gmail.com", "jairochris1@gmail.com"]
      });

      toast.success("Feedback enviado com sucesso! Obrigado pela contribuição.");
      setHasSubmitted(true);
      
      // Reset form
      setRating(0);
      setComment("");
      setSuggestion("");
      setIsHelpful(null);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Feedback Recebido!
          </h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Obrigado por compartilhar sua opinião. Seu feedback nos ajuda a melhorar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
      <CardHeader>
        <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
          Avalie este Artigo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Sua avaliação *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : darkMode
                      ? "text-gray-600"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Helpful */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Este artigo foi útil?
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={isHelpful === true ? "default" : "outline"}
              size="sm"
              onClick={() => setIsHelpful(true)}
              className={isHelpful === true ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Sim
            </Button>
            <Button
              type="button"
              variant={isHelpful === false ? "default" : "outline"}
              size="sm"
              onClick={() => setIsHelpful(false)}
              className={isHelpful === false ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Não
            </Button>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Comentário (opcional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Compartilhe sua opinião sobre este artigo..."
            rows={3}
            className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
          />
        </div>

        {/* Suggestion */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Sugestão de Melhoria (opcional)
          </label>
          <Textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Como podemos melhorar este artigo?"
            rows={2}
            className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? (
            "Enviando..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}