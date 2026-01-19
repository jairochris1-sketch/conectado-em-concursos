import { useState, useEffect } from "react";
import { SharedSummary } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Eye, Plus, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const subjects = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" }
];

export default function SharedSummariesPage() {
  const [user, setUser] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [filteredSummaries, setFilteredSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [newSummary, setNewSummary] = useState({
    title: "",
    content: "",
    subject: "",
    topic: "",
    tags: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSummaries();
  }, [summaries, searchTerm, selectedSubject]);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const allSummaries = await SharedSummary.list("-created_date");
      setSummaries(allSummaries);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const filterSummaries = () => {
    let filtered = summaries;

    if (selectedSubject !== "all") {
      filtered = filtered.filter(s => s.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSummaries(filtered);
  };

  const handleCreateSummary = async () => {
    if (!newSummary.title || !newSummary.content || !newSummary.subject) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const tags = newSummary.tags ? newSummary.tags.split(",").map(t => t.trim()) : [];
      
      await SharedSummary.create({
        title: newSummary.title,
        content: newSummary.content,
        subject: newSummary.subject,
        topic: newSummary.topic,
        tags,
        author_name: user.full_name,
        author_email: user.email,
        author_photo_url: user.profile_photo_url
      });

      toast.success("Resumo compartilhado com sucesso!");
      setIsCreateOpen(false);
      setNewSummary({ title: "", content: "", subject: "", topic: "", tags: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao criar resumo");
    }
  };

  const handleLike = async (summary) => {
    const liked_by = summary.liked_by || [];
    const hasLiked = liked_by.includes(user.email);

    await SharedSummary.update(summary.id, {
      likes_count: hasLiked ? summary.likes_count - 1 : summary.likes_count + 1,
      liked_by: hasLiked 
        ? liked_by.filter(e => e !== user.email)
        : [...liked_by, user.email]
    });

    loadData();
    if (selectedSummary?.id === summary.id) {
      const updated = await SharedSummary.filter({ id: summary.id });
      setSelectedSummary(updated[0]);
    }
  };

  const handleView = async (summary) => {
    await SharedSummary.update(summary.id, {
      views_count: (summary.views_count || 0) + 1
    });

    setSelectedSummary(summary);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p>Carregando resumos...</p>
      </div>
    );
  }

  if (selectedSummary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setSelectedSummary(null)} variant="outline" className="mb-4">
            ← Voltar
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedSummary.author_photo_url} />
                    <AvatarFallback>{selectedSummary.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{selectedSummary.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                      Por {selectedSummary.author_name} • {new Date(selectedSummary.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge>{subjects.find(s => s.value === selectedSummary.subject)?.label}</Badge>
              </div>
              {selectedSummary.topic && (
                <Badge variant="outline">{selectedSummary.topic}</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{selectedSummary.content}</p>
              </div>

              {selectedSummary.tags?.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {selectedSummary.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(selectedSummary)}
                  className={selectedSummary.liked_by?.includes(user.email) ? "text-blue-600" : ""}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {selectedSummary.likes_count || 0} curtidas
                </Button>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  {selectedSummary.views_count || 0} visualizações
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumos Compartilhados</h1>
            <p className="text-gray-600 dark:text-gray-400">Compartilhe e descubra resumos da comunidade</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Compartilhar Resumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compartilhar Novo Resumo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    placeholder="Ex: Resumo de Concordância Verbal"
                    value={newSummary.title}
                    onChange={(e) => setNewSummary({ ...newSummary, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Disciplina</label>
                  <Select value={newSummary.subject} onValueChange={(v) => setNewSummary({ ...newSummary, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tópico (opcional)</label>
                  <Input
                    placeholder="Ex: Concordância verbal"
                    value={newSummary.topic}
                    onChange={(e) => setNewSummary({ ...newSummary, topic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo do Resumo</label>
                  <Textarea
                    placeholder="Digite seu resumo aqui..."
                    value={newSummary.content}
                    onChange={(e) => setNewSummary({ ...newSummary, content: e.target.value })}
                    rows={10}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (separadas por vírgula)</label>
                  <Input
                    placeholder="Ex: português, gramática, concordância"
                    value={newSummary.tags}
                    onChange={(e) => setNewSummary({ ...newSummary, tags: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateSummary} className="w-full">Publicar Resumo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Buscar resumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as disciplinas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as disciplinas</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map(summary => (
            <Card
              key={summary.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleView(summary)}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={summary.author_photo_url} />
                    <AvatarFallback>{summary.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{summary.author_name}</p>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{summary.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {subjects.find(s => s.value === summary.subject)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {summary.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {summary.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {summary.views_count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSummaries.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum resumo encontrado</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}