import { useState, useEffect } from "react";
import { ForumPost, ForumReply } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Eye, Pin, CheckCircle, Plus, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const categories = [
  { value: "depoimentos", label: "Depoimentos de Aprovação" },
  { value: "dicas_estudos", label: "Dicas de Estudos" },
  { value: "motivacao", label: "Motivação" },
  { value: "organizacao", label: "Organização e Rotina" },
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "outros", label: "Outros Assuntos" }
];

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    subject: "",
    topic: ""
  });

  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedSubject]);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const allPosts = await ForumPost.list("-created_date");
      setPosts(allPosts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const filterPosts = () => {
    let filtered = posts;

    if (selectedSubject !== "all") {
      filtered = filtered.filter(p => p.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content || !newPost.subject) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await ForumPost.create({
        ...newPost,
        author_name: user.full_name,
        author_email: user.email,
        author_photo_url: user.profile_photo_url
      });

      toast.success("Post criado com sucesso!");
      setIsCreateOpen(false);
      setNewPost({ title: "", content: "", subject: "", topic: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao criar post");
    }
  };

  const handleLikePost = async (post) => {
    const liked_by = post.liked_by || [];
    const hasLiked = liked_by.includes(user.email);

    await ForumPost.update(post.id, {
      likes_count: hasLiked ? post.likes_count - 1 : post.likes_count + 1,
      liked_by: hasLiked 
        ? liked_by.filter(e => e !== user.email)
        : [...liked_by, user.email]
    });

    loadData();
  };

  const handleViewPost = async (post) => {
    await ForumPost.update(post.id, {
      views_count: (post.views_count || 0) + 1
    });

    setSelectedPost(post);
    const postReplies = await ForumReply.filter({ post_id: post.id });
    setReplies(postReplies);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Digite uma resposta");
      return;
    }

    try {
      await ForumReply.create({
        post_id: selectedPost.id,
        content: replyContent,
        author_name: user.full_name,
        author_email: user.email,
        author_photo_url: user.profile_photo_url
      });

      await ForumPost.update(selectedPost.id, {
        replies_count: (selectedPost.replies_count || 0) + 1
      });

      toast.success("Resposta enviada!");
      setReplyContent("");
      
      const updatedReplies = await ForumReply.filter({ post_id: selectedPost.id });
      setReplies(updatedReplies);
      loadData();
    } catch (error) {
      toast.error("Erro ao enviar resposta");
    }
  };

  const handleLikeReply = async (reply) => {
    const liked_by = reply.liked_by || [];
    const hasLiked = liked_by.includes(user.email);

    await ForumReply.update(reply.id, {
      likes_count: hasLiked ? reply.likes_count - 1 : reply.likes_count + 1,
      liked_by: hasLiked 
        ? liked_by.filter(e => e !== user.email)
        : [...liked_by, user.email]
    });

    const updatedReplies = await ForumReply.filter({ post_id: selectedPost.id });
    setReplies(updatedReplies);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p>Carregando comunidade...</p>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setSelectedPost(null)} variant="outline" className="mb-4">
            ← Voltar
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedPost.author_photo_url} />
                    <AvatarFallback>{selectedPost.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{selectedPost.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                      Por {selectedPost.author_name} • {new Date(selectedPost.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge>{categories.find(s => s.value === selectedPost.subject)?.label}</Badge>
                  {selectedPost.is_resolved && <Badge variant="outline" className="text-green-600">✓ Resolvido</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap mb-4">{selectedPost.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikePost(selectedPost)}
                  className={selectedPost.liked_by?.includes(user.email) ? "text-blue-600" : ""}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {selectedPost.likes_count || 0}
                </Button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {selectedPost.replies_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedPost.views_count || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Respostas ({replies.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {replies.map(reply => (
                  <div key={reply.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={reply.author_photo_url} />
                        <AvatarFallback>{reply.author_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{reply.author_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_date).toLocaleDateString()}
                          </span>
                          {reply.is_best_answer && (
                            <Badge variant="outline" className="text-green-600">Melhor Resposta</Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-2">{reply.content}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeReply(reply)}
                          className={reply.liked_by?.includes(user.email) ? "text-blue-600" : ""}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {reply.likes_count || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleReply} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fórum da Comunidade</h1>
            <p className="text-gray-600 dark:text-gray-400">Tire dúvidas e compartilhe conhecimento</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Discussão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Discussão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    placeholder="Digite o título da discussão"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={newPost.subject} onValueChange={(v) => setNewPost({ ...newPost, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tópico (opcional)</label>
                  <Input
                    placeholder="Ex: Concordância verbal"
                    value={newPost.topic}
                    onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    placeholder="Descreva sua dúvida ou compartilhe conhecimento..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <Button onClick={handleCreatePost} className="w-full">Publicar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Buscar discussões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredPosts.map(post => (
            <Card
              key={post.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewPost(post)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={post.author_photo_url} />
                    <AvatarFallback>{post.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {post.is_pinned && <Pin className="w-4 h-4 text-yellow-600" />}
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge>{categories.find(s => s.value === post.subject)?.label}</Badge>
                        {post.is_resolved && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{post.author_name}</span>
                      <span>•</span>
                      <span>{new Date(post.created_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.replies_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma discussão encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}