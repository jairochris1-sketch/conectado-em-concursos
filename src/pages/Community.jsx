import { useState, useEffect } from "react";
import { ForumPost, ForumReply } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Eye, Pin, CheckCircle, Plus, Send, Trash2, Edit2, MoreVertical, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FollowButton from "@/components/social/FollowButton";
import StudyPartnerButton from "@/components/social/StudyPartnerButton";
import StudyPartnerRequests from "@/components/social/StudyPartnerRequests";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { StaffBadge } from "@/components/ui/staff-badge";
import UserLink from "@/components/social/UserLink";
import OnlineUsersSidebar from "@/components/social/OnlineUsersSidebar";

const defaultCategories = [
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
{ value: "outros", label: "Outros Assuntos" }];


export default function CommunityPage({ embedded = false }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(defaultCategories);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deleteReplyId, setDeleteReplyId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

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

      const allCategories = await base44.entities.ForumCategory.list('order');
      if (allCategories && allCategories.length > 0) {
        setCategories(allCategories.filter((c) => c.is_active));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const filterPosts = () => {
    let filtered = posts;

    if (selectedSubject !== "all") {
      filtered = filtered.filter((p) => p.subject === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
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
      liked_by: hasLiked ?
      liked_by.filter((e) => e !== user.email) :
      [...liked_by, user.email]
    });

    if (!hasLiked && post.author_email !== user.email) {
      await base44.functions.invoke("sendAppNotification", {
        targetEmail: post.author_email,
        title: "Alguém curtiu sua discussão",
        message: `${user.full_name} curtiu seu post: "${post.title}"`,
        type: "like",
        actionUrl: createPageUrl("Community"),
        relatedUserName: user.full_name,
        relatedUserPhoto: user.profile_photo_url,
        entityId: post.id
      });
    }

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
        author_photo_url: user.profile_photo_url,
        parent_reply_id: replyingTo ? replyingTo.id : null
      });

      await ForumPost.update(selectedPost.id, {
        replies_count: (selectedPost.replies_count || 0) + 1
      });

      // If answering someone directly
      if (replyingTo && replyingTo.email && replyingTo.email !== user.email) {
        await base44.functions.invoke("sendAppNotification", {
          targetEmail: replyingTo.email,
          title: "Você foi respondido!",
          message: `${user.full_name} respondeu ao seu comentário na discussão "${selectedPost.title}".`,
          type: "mention",
          actionUrl: createPageUrl("Community"),
          relatedUserName: user.full_name,
          relatedUserPhoto: user.profile_photo_url,
          entityId: selectedPost.id
        });
      } else if (selectedPost.author_email !== user.email) {
        // If not replying directly, notify the post author
        await base44.functions.invoke("sendAppNotification", {
          targetEmail: selectedPost.author_email,
          title: "Nova resposta na sua discussão",
          message: `${user.full_name} respondeu: "${replyContent.substring(0, 100)}${replyContent.length > 100 ? '...' : ''}"`,
          type: "reply",
          actionUrl: createPageUrl("Community"),
          relatedUserName: user.full_name,
          relatedUserPhoto: user.profile_photo_url,
          entityId: selectedPost.id
        });
      }

      toast.success("Resposta enviada!");
      setReplyContent("");
      setReplyingTo(null);

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
      liked_by: hasLiked ?
      liked_by.filter((e) => e !== user.email) :
      [...liked_by, user.email]
    });

    if (!hasLiked && reply.author_email !== user.email) {
      await base44.functions.invoke("sendAppNotification", {
        targetEmail: reply.author_email,
        title: "Alguém curtiu sua resposta",
        message: `${user.full_name} curtiu sua resposta no fórum`,
        type: "like",
        actionUrl: createPageUrl("Community"),
        relatedUserName: user.full_name,
        relatedUserPhoto: user.profile_photo_url,
        entityId: reply.id
      });
    }

    const updatedReplies = await ForumReply.filter({ post_id: selectedPost.id });
    setReplies(updatedReplies);
  };

  const handleEditPost = async () => {
    if (!editingPost.title || !editingPost.content || !editingPost.subject) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await ForumPost.update(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        subject: editingPost.subject,
        topic: editingPost.topic
      });

      toast.success("Post atualizado!");
      setEditingPost(null);

      if (selectedPost?.id === editingPost.id) {
        setSelectedPost({ ...selectedPost, ...editingPost });
      }
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar post");
    }
  };

  const handleDeletePost = async () => {
    try {
      await ForumReply.filter({ post_id: deletePostId }).then((replies) =>
      Promise.all(replies.map((r) => ForumReply.delete(r.id)))
      );
      await ForumPost.delete(deletePostId);

      toast.success("Post excluído!");
      setDeletePostId(null);
      setSelectedPost(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir post");
    }
  };

  const handleEditReply = async (reply) => {
    if (!editingReply.content.trim()) {
      toast.error("Digite o conteúdo da resposta");
      return;
    }

    try {
      await ForumReply.update(reply.id, {
        content: editingReply.content
      });

      toast.success("Resposta atualizada!");
      setEditingReply(null);

      const updatedReplies = await ForumReply.filter({ post_id: selectedPost.id });
      setReplies(updatedReplies);
    } catch (error) {
      toast.error("Erro ao atualizar resposta");
    }
  };

  const handleDeleteReply = async () => {
    try {
      await ForumReply.delete(deleteReplyId);

      await ForumPost.update(selectedPost.id, {
        replies_count: Math.max(0, (selectedPost.replies_count || 0) - 1)
      });

      toast.success("Resposta excluída!");
      setDeleteReplyId(null);

      const updatedReplies = await ForumReply.filter({ post_id: selectedPost.id });
      setReplies(updatedReplies);
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir resposta");
    }
  };

  const buildReplyTree = (flatReplies) => {
    const replyMap = {};
    const roots = [];
    flatReplies.forEach((r) => {
      replyMap[r.id] = { ...r, children: [] };
    });
    flatReplies.forEach((r) => {
      if (r.parent_reply_id && replyMap[r.parent_reply_id]) {
        replyMap[r.parent_reply_id].children.push(replyMap[r.id]);
      } else {
        roots.push(replyMap[r.id]);
      }
    });
    const sortByDate = (a, b) => new Date(a.created_date) - new Date(b.created_date);
    roots.sort(sortByDate);
    const sortChildren = (node) => {
      node.children.sort(sortByDate);
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);
    return roots;
  };

  const renderReplies = (replyNodes, level = 0) => {
    return replyNodes.map((reply) =>
    <div key={reply.id} className={`${level > 0 ? 'ml-8 md:ml-12 mt-2 relative' : 'mt-4'}`}>
        {level > 0 &&
      <div className="absolute -left-6 md:-left-8 top-4 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      }
        {level > 0 &&
      <div className="absolute -left-6 md:-left-8 top-4 w-6 h-px bg-gray-200 dark:bg-gray-700" />
      }
        <div className="flex items-start gap-2 relative z-10">
          <Avatar className={`w-8 h-8 ${level > 0 ? 'w-6 h-6 mt-1' : ''} shrink-0 bg-white`}>
            <AvatarImage src={reply.author_photo_url} />
            <AvatarFallback>{reply.author_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-4 py-2 inline-block max-w-full">
              <div className="flex items-center gap-2 mb-0.5">
                <UserLink
                  email={reply.author_email}
                  name={reply.author_name}
                  photo={reply.author_photo_url}
                  className="font-bold text-sm hover:underline text-gray-900 dark:text-white">
                  {reply.author_name}
                </UserLink>
                <StaffBadge email={reply.author_email} className="ml-0.5" />
                {reply.is_best_answer &&
              <Badge variant="outline" className="text-green-600 bg-green-50 scale-75 origin-left">Melhor Resposta</Badge>
              }
                {reply.author_email === user.email &&
              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 -mr-2 text-gray-400">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingReply(reply)}>
                        <Edit2 className="w-3 h-3 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteReplyId(reply.id)} className="text-red-600">
                        <Trash2 className="w-3 h-3 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              }
              </div>
              {editingReply?.id === reply.id ?
            <div className="space-y-2 mt-2 w-full min-w-[200px] md:min-w-[400px]">
                  <Textarea
                value={editingReply.content}
                onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditReply(reply)}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReply(null)}>Cancelar</Button>
                  </div>
                </div> :
            <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{reply.content}</p>
            }
            </div>
            {(!editingReply || editingReply.id !== reply.id) &&
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mt-1 ml-2">
                <span>{new Date(reply.created_date).toLocaleDateString()}</span>
                <button
              className={`hover:underline ${reply.liked_by?.includes(user.email) ? "text-blue-600" : ""}`}
              onClick={() => handleLikeReply(reply)}>

                  Curtir {reply.likes_count > 0 && `(${reply.likes_count})`}
                </button>
                <button
              className="hover:underline"
              onClick={() => setReplyingTo({ id: reply.id, name: reply.author_name, email: reply.author_email })}>

                  Responder
                </button>
              </div>
          }
          </div>
        </div>
        {reply.children && reply.children.length > 0 &&
      <div className="pl-2 relative">
            {renderReplies(reply.children, level + 1)}
          </div>
      }
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p>Carregando comunidade...</p>
      </div>);

  }

  if (selectedPost) {
    return (
      <div className={embedded ? "w-full" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-6"}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <Button onClick={() => setSelectedPost(null)} variant="outline" className="bg-blue-600 text-slate-50 mb-4 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-9">
                ← Voltar
              </Button>

              <Card className="mb-6 bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="bg-white dark:bg-slate-900 p-6 rounded-t-lg flex flex-col space-y-1.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={selectedPost.author_photo_url} />
                    <AvatarFallback>{selectedPost.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl break-words text-gray-900 dark:text-slate-200">{selectedPost.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="flex items-center text-sm text-gray-400 flex-wrap">
                              Por{" "}
                              <UserLink
                                email={selectedPost.author_email}
                                name={selectedPost.author_name}
                                photo={selectedPost.author_photo_url}
                                className="font-semibold hover:underline text-blue-600 ml-1">
                                {selectedPost.author_name}
                              </UserLink>
                              <StaffBadge email={selectedPost.author_email} className="ml-1" />
                              <span className="ml-1">• {new Date(selectedPost.created_date).toLocaleDateString()}</span>
                            </p>
                      <FollowButton
                        targetEmail={selectedPost.author_email}
                        targetName={selectedPost.author_name}
                        targetPhotoUrl={selectedPost.author_photo_url}
                        size="sm" />

                      <StudyPartnerButton
                        currentUser={user}
                        targetEmail={selectedPost.author_email}
                        targetName={selectedPost.author_name}
                        targetPhoto={selectedPost.author_photo_url} />

                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className="bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80">{categories.find((s) => s.value === selectedPost.subject)?.label}</Badge>
                  {selectedPost.is_resolved && <Badge variant="outline" className="text-green-600">✓ Resolvido</Badge>}
                  {selectedPost.author_email === user.email &&
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingPost(selectedPost)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletePostId(selectedPost.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-white dark:bg-slate-900 pt-6 p-6 rounded-b-lg">
              <p className="whitespace-pre-wrap mb-4 text-gray-800 dark:text-slate-300">{selectedPost.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 border-t border-gray-100 dark:border-slate-800 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikePost(selectedPost)}
                  className={selectedPost.liked_by?.includes(user.email) ? "text-blue-600" : ""}>

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

          <Card className="mb-6 bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="bg-white dark:bg-slate-900 p-6 flex flex-col space-y-1.5 border-b border-gray-100 dark:border-slate-800 rounded-t-lg">
              <CardTitle className="text-gray-900 dark:text-white">Respostas ({replies.length})</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-slate-900 pt-0 p-6 rounded-b-lg">
              <div className="space-y-1 mb-8">
                {renderReplies(buildReplyTree(replies))}
              </div>

              <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-6">
                {replyingTo &&
                <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-t-lg text-sm mb-1">
                    <span>Respondendo a <strong>{replyingTo.name}</strong></span>
                    <button onClick={() => setReplyingTo(null)} className="hover:text-blue-900 font-bold">&times;</button>
                  </div>
                }
                <div className="flex gap-2">
                  <Textarea
                    placeholder={replyingTo ? `Escreva sua resposta...` : "Escreva um comentário..."}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    rows={3} />

                  <Button onClick={handleReply} className="bg-blue-600 text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9 self-end">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>

            {!embedded && (
              <div className="hidden lg:block w-72 shrink-0">
                <OnlineUsersSidebar />
              </div>
            )}
          </div>

          <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Discussão</DialogTitle>
              </DialogHeader>
              {editingPost &&
              <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Título</label>
                    <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} />

                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select value={editingPost.subject} onValueChange={(v) => setEditingPost({ ...editingPost, subject: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((s) =>
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tópico (opcional)</label>
                    <Input
                    value={editingPost.topic || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, topic: e.target.value })} />

                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                    <Textarea
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    rows={6} />

                  </div>
                  <Button onClick={handleEditPost} className="w-full">Salvar Alterações</Button>
                </div>
              }
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir discussão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o post e todas as suas respostas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente sua resposta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReply} className="bg-red-600 hover:bg-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );

  }

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-6"}>
      <div className="max-w-6xl mx-auto">
        {!embedded && <StudyPartnerRequests currentUser={user} />}

        <div className={`flex items-center justify-between ${embedded ? 'mb-4' : 'mb-6'}`}>
          {!embedded && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex">
                <ArrowLeft className="w-5 h-5" /> Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fórum da Comunidade</h1>
                <p className="text-gray-600 dark:text-gray-400">Tire dúvidas e compartilhe conhecimento</p>
              </div>
            </div>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-slate-200 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
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
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />

                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={newPost.subject} onValueChange={(v) => setNewPost({ ...newPost, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((s) =>
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tópico (opcional)</label>
                  <Input
                    placeholder="Ex: Concordância verbal"
                    value={newPost.topic}
                    onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })} />

                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    placeholder="Descreva sua dúvida ou compartilhe conhecimento..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6} />

                </div>
                <Button onClick={handleCreatePost} className="w-full">Publicar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar discussões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1" />

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((s) =>
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4 min-w-0">
            {filteredPosts.map((post) =>
          <Card
            key={post.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewPost(post)}>

              <CardContent className="bg-slate-800 p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={post.author_photo_url} />
                    <AvatarFallback>{post.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {post.is_pinned && <Pin className="w-4 h-4 text-yellow-600" />}
                          <h3 className="text-slate-200 text-lg font-semibold">{post.title}</h3>
                        </div>
                        <p className="text-slate-300 mb-2 text-sm dark:text-gray-400 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:ml-4">
                        <Badge className="bg-blue-600 text-slate-200 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80">{categories.find((s) => s.value === post.subject)?.label}</Badge>
                        {post.is_resolved && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <UserLink
                          email={post.author_email}
                          name={post.author_name}
                          photo={post.author_photo_url}
                          className="font-semibold hover:underline text-blue-600"
                          onClick={(e) => e.stopPropagation()}>
                          {post.author_name}
                        </UserLink>
                        <StaffBadge email={post.author_email} />
                      </div>
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
          )}

          {filteredPosts.length === 0 &&
          <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma discussão encontrada</p>
              </CardContent>
            </Card>
          }
          </div>
          
          {!embedded && (
            <div className="hidden lg:block w-72 shrink-0">
              <OnlineUsersSidebar />
            </div>
          )}
        </div>
      </div>
    </div>);

}