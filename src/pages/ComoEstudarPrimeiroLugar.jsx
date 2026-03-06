import { useEffect, useState } from "react";
import { Article, YouTubeVideo, SiteContent, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EnhancedArticleReader from "../components/reading/EnhancedArticleReader";
import { BookOpen, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";

export default function ComoEstudarPrimeiroLugar() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState({ title: "", subtitle: "" });
  const [contentId, setContentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guideArticlesMap, setGuideArticlesMap] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [userPlan, setUserPlan] = useState('gratuito');
  const [currentUser, setCurrentUser] = useState(null);
  const [dbProgress, setDbProgress] = useState({});
  const [globalProgress, setGlobalProgress] = useState(0);

  // Determinar guia a partir da URL, localStorage ou primeiro guia disponível
  useEffect(() => {
    if (guides.length === 0 || selectedGuide) return;

    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('slug');
    const savedGuide = localStorage.getItem('lastSelectedGuide');

    let guideToSelect = urlSlug || savedGuide || guides[0]?.page_key;
    
    if (guideToSelect && guides.some(g => g.page_key === guideToSelect)) {
      setSelectedGuide(guideToSelect);
    } else if (guides.length > 0) {
      setSelectedGuide(guides[0].page_key);
    }
  }, [guides, selectedGuide]);

  // Atualizar artigos/vídeos quando mudar de guia e salvar no localStorage
  useEffect(() => {
    if (selectedGuide) {
      localStorage.setItem('lastSelectedGuide', selectedGuide);
      
      const guide = guides.find(g => g.page_key === selectedGuide);
      if (guide) {
        setContent({ title: guide.title || "", subtitle: guide.subtitle || "" });
        setContentId(guide.id);
        setArticles(guideArticlesMap[selectedGuide] || []);
      }

      if (currentUser) {
        base44.entities.ArticleProgress.filter({ user_email: currentUser.email, guide_slug: selectedGuide })
          .then(userProgress => {
            const progressMap = {};
            userProgress.forEach(p => {
              progressMap[p.article_id] = p.progress_percent;
            });
            setDbProgress(progressMap);
          })
          .catch(console.error);
      }
    }
  }, [selectedGuide, guides, guideArticlesMap, currentUser]);

  useEffect(() => {
    if (articles.length > 0) {
      let completed = 0;
      articles.forEach(a => {
        if (dbProgress[a.id] === 100) completed++;
      });
      setGlobalProgress(Math.round((completed / articles.length) * 100));
    } else {
      setGlobalProgress(0);
    }
  }, [articles, dbProgress]);

  const saveArticleProgress = async (articleId, percent) => {
    if (!currentUser) return;
    try {
      const existing = await base44.entities.ArticleProgress.filter({ user_email: currentUser.email, article_id: articleId });
      if (existing.length > 0) {
        if (existing[0].progress_percent !== percent) {
          await base44.entities.ArticleProgress.update(existing[0].id, { progress_percent: percent, is_completed: percent === 100 });
        }
      } else {
        await base44.entities.ArticleProgress.create({
          user_email: currentUser.email,
          article_id: articleId,
          guide_slug: selectedGuide,
          progress_percent: percent,
          is_completed: percent === 100
        });
      }
      setDbProgress(prev => ({ ...prev, [articleId]: percent }));
    } catch (e) {
      console.error(e);
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [user, arts, vids, scAll] = await Promise.all([
          User.me().catch(() => null),
          Article.filter({ is_published: true }),
          YouTubeVideo.filter({ is_active: true }),
          SiteContent.list('-created_date', 500)
        ]);

        setIsAdmin(!!user && (user.role === 'admin' || user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com' || user.email === 'juniorgmj2016@gmail.com'));

        setCurrentUser(user);
        let plan = 'gratuito';
        if (user) {
          const [activeSubs, specialUsers] = await Promise.all([
            base44.entities.Subscription.filter({ user_email: user.email, status: 'active' }),
            base44.entities.SpecialUser.filter({ email: user.email, is_active: true })
          ]);
          
          if (activeSubs.length > 0) {
            const hasPremium = activeSubs.some(sub => sub.plan === 'avancado');
            const hasStandard = activeSubs.some(sub => sub.plan === 'padrao');
            plan = hasPremium ? 'avancado' : (hasStandard ? 'padrao' : activeSubs[0].plan);
          }
          if (specialUsers.length > 0) {
            const specialUser = specialUsers[0];
            if (!specialUser.valid_until || new Date(specialUser.valid_until) >= new Date()) {
              plan = specialUser.plan;
            }
          }
        }
        setUserPlan(plan);

        const defaultTitle = "Como estudar para ser aprovado em primeiro lugar";
        const defaultSubtitle = "Guia prático com materiais selecionados para acelerar sua aprovação. Os itens abaixo são exibidos sem bloqueios, em um formato limpo, como uma folha A4.";
        const allGuides = (scAll || [])
          .filter(sc => typeof sc.page_key === 'string' && sc.page_key.toLowerCase().startsWith('guia_'))
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || (a.title || a.page_key).localeCompare(b.title || b.page_key));
        setGuides(allGuides);

        // Não definir selectedGuide aqui, deixar para o useEffect de determinação

        const allArts = arts || [];
        const map = {};
        (allGuides || []).forEach(g => {
          const gs = g.page_key.toLowerCase();
          map[g.page_key] = allArts.filter(a => Array.isArray(a.tags) && a.tags.map(t => (t || "").toLowerCase()).includes(gs))
            .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.created_date) - new Date(b.created_date));
        });
        setGuideArticlesMap(map);

        setArticles(allArts.filter(a => Array.isArray(a.tags) && a.tags.map(t => (t || "").toLowerCase()).includes("guia_aprovacao"))
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.created_date) - new Date(b.created_date)));
        setVideos((vids || []).filter(v => (v.topic || "").toLowerCase() === "guia_aprovacao"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveContent = async () => {
    const payload = { page_key: "guia_aprovacao", title: content.title, subtitle: content.subtitle };
    if (contentId) {
      await SiteContent.update(contentId, payload);
    } else {
      const created = await SiteContent.create(payload);
      setContentId(created.id);
    }
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 md:py-8 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="md:hidden mb-4 overflow-x-auto -mx-4 px-4">
              <div className="flex gap-2 pb-2">
                {guides.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGuide(g.page_key)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex-shrink-0 ${
                      selectedGuide === g.page_key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    {(g.title || g.page_key).replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-md p-4 sticky top-24 max-h-[80vh] overflow-auto">
              <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Guias</h2>
              <div className="space-y-2">
                {guides.map((g) => (
                  <div key={g.id} className={`rounded border p-2 ${g.page_key === 'guia_aprovacao' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    {g.page_key === 'guia_aprovacao' ? (
                      <div className="text-left w-full font-medium text-sm text-gray-900 dark:text-gray-100">
                        {(g.title || g.page_key).replaceAll('_', ' ')}
                      </div>
                    ) : (
                      <a className="block text-left w-full font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-indigo-700 dark:hover:text-indigo-400" href={createPageUrl(`GuiaEstudos?slug=${g.page_key}`)}>
                        {(g.title || g.page_key).replaceAll('_', ' ')}
                      </a>
                    )}
                    {guideArticlesMap[g.page_key]?.length > 0 && (
                      <ul className="mt-2 pl-3 space-y-1">
                        {guideArticlesMap[g.page_key].map((a) => (
                          <li key={a.id}>
                            {g.page_key === 'guia_aprovacao' ? (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (userPlan === 'gratuito' && !isAdmin) {
                                    toast.error("O acesso aos resumos é exclusivo para assinantes. Faça um upgrade.");
                                    return;
                                  }
                                  setSelectedArticle(a);
                                }}
                                className="text-left w-full text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                {a.title}
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (userPlan === 'gratuito' && !isAdmin) {
                                    toast.error("O acesso aos resumos é exclusivo para assinantes. Faça um upgrade.");
                                    return;
                                  }
                                  navigate(createPageUrl(`GuiaEstudos?slug=${g.page_key}&articleId=${a.id}`));
                                }}
                                className="text-left w-full text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                {a.title}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {guides.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum guia criado ainda.</p>
                )}
              </div>
            </div>
          </aside>
          <section className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-md p-4 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{content.title}</h1>
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">{content.subtitle}</p>
        
        {!loading && articles.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${globalProgress === 100 ? 'text-green-500' : 'text-indigo-500'}`} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso do Guia</span>
              </div>
              <span className={`text-sm font-bold ${globalProgress === 100 ? 'text-green-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {globalProgress}%
              </span>
            </div>
            <Progress value={globalProgress} className="h-2" />
          </div>
        )}

        {isAdmin && (
          <div className="mb-4">
            {!editMode ? (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                Editar guia
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  placeholder="Título do guia"
                />
                <Textarea
                  value={content.subtitle}
                  onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                  placeholder="Descrição do guia"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveContent} className="bg-indigo-600 hover:bg-indigo-700 text-white">Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && articles.some(a => a.is_featured) && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Recomendados</h2>
            <div className="space-y-4">
              {articles.filter(a => a.is_featured).map((a) => (
                <Card key={a.id} className="dark:bg-gray-700 dark:border-gray-600 relative">
                  <CardContent className="p-4 cursor-pointer" onClick={(e) => {
                    if (userPlan === 'gratuito' && !isAdmin) {
                      e.preventDefault();
                      toast.error("O acesso aos resumos é exclusivo para assinantes. Faça um upgrade.");
                    } else {
                      setSelectedArticle(a);
                    }
                  }}>
                    {userPlan === 'gratuito' && !isAdmin && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span className="text-blue-700 dark:text-blue-400 font-semibold hover:underline">{a.title}</span>
                    {a.summary && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{a.summary}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {loading && <div className="text-gray-700 dark:text-gray-300">Carregando conteúdo...</div>}

        {!loading && videos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Vídeos</h2>
            <div className="space-y-6">
              {videos.map((v) => {
                const id = v.video_id || extractYouTubeId(v.youtube_url);
                return (
                  <div key={v.id} className="w-full">
                    <div className="aspect-video bg-black rounded">
                      {id ? (
                        <iframe
                          className="w-full h-full rounded"
                          src={`https://www.youtube.com/embed/${id}`}
                          title={v.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <Card><CardContent className="p-4">{v.title}</CardContent></Card>
                      )}
                    </div>
                    <div className="mt-2">
                      <Link to={createPageUrl(`AssistirAula?slug=guia_aprovacao&videoId=${id}`)}>
                        <Button size="sm" variant="outline">Assistir aula</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading && articles.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Artigos</h2>
            {articles.map((a) => (
              <Card key={a.id} id={`art-${a.id}`} className="dark:bg-gray-700 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => {
                if (userPlan === 'gratuito' && !isAdmin) {
                  toast.error("O acesso aos resumos é exclusivo para assinantes. Faça um upgrade.");
                  return;
                }
                setSelectedArticle(a);
              }}>
                <CardContent className="p-6">
                  {userPlan === 'gratuito' && !isAdmin && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {a.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {a.author && <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{a.author}</Badge>}
                        {a.reading_time && <Badge variant="secondary" className="dark:bg-gray-600 dark:text-gray-300">{a.reading_time} min</Badge>}
                      </div>
                      {a.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{a.summary}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <BookOpen className="w-4 h-4 mr-1" />
                      Ler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {!loading && videos.length === 0 && articles.length === 0 && (
          <div className="text-gray-600 dark:text-gray-400">
            Nenhum conteúdo marcado para este guia ainda.
            Marque artigos com a tag <b className="text-gray-900 dark:text-white">guia_aprovacao</b> e vídeos com o tópico <b className="text-gray-900 dark:text-white">guia_aprovacao</b>.
          </div>
        )}
            </div>
          </section>
        </div>
      </div>

      {/* Enhanced Article Reader */}
      <EnhancedArticleReader
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}