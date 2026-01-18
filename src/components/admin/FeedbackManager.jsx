import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Lightbulb, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ArticleFeedback.list("-created_date", 200);
      setFeedbacks(data || []);
    } catch (error) {
      console.error("Erro ao carregar feedbacks:", error);
      toast.error("Erro ao carregar feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId, newStatus) => {
    try {
      await base44.entities.ArticleFeedback.update(feedbackId, { status: newStatus });
      toast.success("Status atualizado");
      loadFeedbacks();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const submitResponse = async (feedback) => {
    if (!response.trim()) {
      toast.error("Digite uma resposta");
      return;
    }

    try {
      await base44.entities.ArticleFeedback.update(feedback.id, {
        admin_response: response.trim(),
        status: "respondido"
      });

      // Criar notificação para o usuário
      await base44.entities.Notification.create({
        title: "Resposta ao seu Feedback",
        message: `O administrador respondeu ao seu feedback sobre "${feedback.article_title}"`,
        type: "info",
        is_global: false,
        target_users: [feedback.user_email],
        action_url: null
      });

      toast.success("Resposta enviada com sucesso!");
      setResponse("");
      setRespondingTo(null);
      loadFeedbacks();
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      toast.error("Erro ao enviar resposta");
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const stats = {
    total: feedbacks.length,
    pendente: feedbacks.filter(f => f.status === "pendente").length,
    lido: feedbacks.filter(f => f.status === "lido").length,
    respondido: feedbacks.filter(f => f.status === "respondido").length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0
  };

  if (loading) {
    return <div className="text-center py-8">Carregando feedbacks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.lido}</div>
            <div className="text-sm text-gray-600">Lidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.respondido}</div>
            <div className="text-sm text-gray-600">Respondidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <div className="text-2xl font-bold text-orange-600">{stats.avgRating}</div>
              <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
            </div>
            <div className="text-sm text-gray-600">Média</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todos
        </Button>
        <Button
          variant={filter === "pendente" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pendente")}
        >
          Pendentes
        </Button>
        <Button
          variant={filter === "lido" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("lido")}
        >
          Lidos
        </Button>
        <Button
          variant={filter === "respondido" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("respondido")}
        >
          Respondidos
        </Button>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhum feedback encontrado
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{feedback.article_title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{feedback.user_name}</span>
                      <span>•</span>
                      <span>{new Date(feedback.created_date).toLocaleDateString("pt-BR")}</span>
                      <Badge
                        variant={
                          feedback.status === "pendente"
                            ? "destructive"
                            : feedback.status === "lido"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {feedback.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < feedback.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Helpful */}
                {feedback.is_helpful !== null && (
                  <div className="flex items-center gap-2">
                    {feedback.is_helpful ? (
                      <>
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Artigo foi útil</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Artigo não foi útil</span>
                      </>
                    )}
                  </div>
                )}

                {/* Comment */}
                {feedback.comment && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Comentário
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feedback.comment}</p>
                  </div>
                )}

                {/* Suggestion */}
                {feedback.suggestion && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Sugestão de Melhoria
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{feedback.suggestion}</p>
                  </div>
                )}

                {/* Admin Response */}
                {feedback.admin_response && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Resposta do Administrador
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {feedback.admin_response}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {feedback.status === "pendente" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(feedback.id, "lido")}
                    >
                      Marcar como Lido
                    </Button>
                  )}
                  {feedback.status !== "respondido" && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setRespondingTo(feedback.id)}
                    >
                      Responder
                    </Button>
                  )}
                </div>

                {/* Response Form */}
                {respondingTo === feedback.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => submitResponse(feedback)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Enviar Resposta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponse("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}