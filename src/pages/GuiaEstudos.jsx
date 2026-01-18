import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Article, YouTubeVideo, SiteContent, User, FavoriteArticle } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Sun, Moon, BookMarked, Star, Heart } from "lucide-react";
import { toast } from "sonner";
import ReadingControls from "../components/reading/ReadingControls";
import AnnotationTools from "../components/reading/AnnotationTools";
import ArticleFeedback from "../components/feedback/ArticleFeedback";

export default function GuiaEstudos() {
  const [searchParams] = useSearchParams();
  const initialSlug = (searchParams.get("slug") || "guia_aprovacao").toLowerCase();

  const [slug, setSlug] = useState(initialSlug);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState({ title: "", subtitle: "" });
  const [contentId, setContentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guideArticlesMap, setGuideArticlesMap] = useState({});
  const [guideSearch, setGuideSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [videoSearch, setVideoSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('guideStudiesDarkMode');
    return saved === 'true';
  });
  const [focusMode, setFocusMode] = useState(false);
  const [readingSettings, setReadingSettings] = useState(() => {
    const saved = localStorage.getItem('readingSettings');
    return saved ? JSON.parse(saved) : {
      fontFamily: 'Arial',
      fontSize: 16,
      lineHeight: 1.6,
      maxWidth: '3xl'
    };
  });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [readingProgress, setReadingProgress] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const filteredGuides = guides.filter(g => {
    if (!guideSearch.trim()) return true;
    const search = guideSearch.toLowerCase();
    return (g.title || g.page_key).toLowerCase().includes(search);
  });

  const filteredArticles = articles.filter(a => {
    if (showFavoritesOnly && !favoriteIds.has(a.id)) return false;
    if (!articleSearch.trim()) return true;
    const search = articleSearch.toLowerCase();
    return a.title.toLowerCase().includes(search) || 
           (a.content || '').toLowerCase().includes(search) ||
           (a.summary || '').toLowerCase().includes(search);
  });

  const filteredVideos = videos.filter(v => {
    if (!videoSearch.trim()) return true;
    const search = videoSearch.toLowerCase();
    return v.title.toLowerCase().includes(search) ||
           (v.description || '').toLowerCase().includes(search);
  });

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

        setCurrentUser(user);
        setIsAdmin(!!user && (user.role === 'admin' || user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com' || user.email === 'juniorgmj2016@gmail.com'));

        if (user) {
          const userFavs = await FavoriteArticle.filter({ user_email: user.email });
          setFavorites(userFavs);
          setFavoriteIds(new Set(userFavs.map(f => f.article_id)));
        }

        const defaultTitle = slug.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const defaultSubtitle = "Guia prático com materiais selecionados. Itens exibidos sem bloqueios, em formato limpo.";
        const allGuides = (scAll || [])
          .filter(sc => typeof sc.page_key === 'string' && sc.page_key.toLowerCase().startsWith('guia_'))
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || (a.title || a.page_key).localeCompare(b.title || b.page_key));
        setGuides(allGuides);
        const existing = allGuides.find(g => g.page_key === slug) || null;
        if (existing) {
          setContent({ title: existing.title || defaultTitle, subtitle: existing.subtitle || defaultSubtitle });
          setContentId(existing.id);
        } else {
          setContent({ title: defaultTitle, subtitle: defaultSubtitle });
          setContentId(null);
        }

        const normalizedSlug = slug.toLowerCase();
        setArticles((arts || []).filter(a => Array.isArray(a.tags) && a.tags.map(t => (t || "").toLowerCase()).includes(normalizedSlug))
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.created_date) - new Date(b.created_date)));
        setVideos((vids || []).filter(v => (v.topic || "").toLowerCase() === normalizedSlug));

        const map = {};
        (allGuides || []).forEach(g => {
          const gs = g.page_key.toLowerCase();
          map[g.page_key] = (arts || []).filter(a => Array.isArray(a.tags) && a.tags.map(t => (t || "").toLowerCase()).includes(gs))
            .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.created_date) - new Date(b.created_date));
        });
        setGuideArticlesMap(map);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleSaveContent = async () => {
    const payload = { page_key: slug, title: content.title, subtitle: content.subtitle };
    if (contentId) {
      await SiteContent.update(contentId, payload);
    } else {
      const created = await SiteContent.create(payload);
      setContentId(created.id);
    }
    setEditMode(false);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('guideStudiesDarkMode', newMode.toString());
  };

  const handleReadingSettingsChange = (newSettings) => {
    setReadingSettings(newSettings);
    localStorage.setItem('readingSettings', JSON.stringify(newSettings));
  };

  const handleArticleScroll = (articleId, scrollPosition) => {
    const progress = { ...readingProgress, [articleId]: scrollPosition };
    setReadingProgress(progress);
    localStorage.setItem('readingProgress', JSON.stringify(progress));
  };

  const handleScroll = (e) => {
    const element = e.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);
  };

  const toggleFavorite = async (article) => {
    if (!currentUser) {
      toast.error('Faça login para favoritar artigos');
      return;
    }

    try {
      if (favoriteIds.has(article.id)) {
        const fav = favorites.find(f => f.article_id === article.id);
        if (fav) {
          await FavoriteArticle.delete(fav.id);
          setFavorites(favorites.filter(f => f.id !== fav.id));
          const newIds = new Set(favoriteIds);
          newIds.delete(article.id);
          setFavoriteIds(newIds);
          toast.success('Removido dos favoritos');
        }
      } else {
        const newFav = await FavoriteArticle.create({
          article_id: article.id,
          article_title: article.title,
          user_email: currentUser.email
        });
        setFavorites([...favorites, newFav]);
        setFavoriteIds(new Set([...favoriteIds, article.id]));
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem('readingProgress');
    if (savedProgress) {
      setReadingProgress(JSON.parse(savedProgress));
    }
  }, []);

  useEffect(() => {
    if (selectedArticle && readingProgress[selectedArticle.id]) {
      setTimeout(() => {
        window.scrollTo(0, readingProgress[selectedArticle.id]);
      }, 100);
    }
  }, [selectedArticle]);

  if (focusMode && selectedArticle) {
    const maxWidthClasses = {
      'full': 'max-w-full',
      '4xl': 'max-w-4xl',
      '3xl': 'max-w-3xl',
      '2xl': 'max-w-2xl',
      'xl': 'max-w-xl'
    };

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="sticky top-0 z-10 border-b backdrop-blur-sm" style={{ backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
          <div 
            className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" 
            style={{ width: `${scrollProgress}%` }}
          />
          <div className="mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFocusMode(false)}
                className={darkMode ? 'bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700 hover:text-white' : ''}
              >
                Sair do Modo Foco
              </Button>
              <Button
                variant={favoriteIds.has(selectedArticle.id) ? "default" : "outline"}
                size="icon"
                onClick={() => toggleFavorite(selectedArticle)}
                className={favoriteIds.has(selectedArticle.id) ? 'bg-red-500 hover:bg-red-600 text-white' : (darkMode ? 'bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700' : '')}
                title={favoriteIds.has(selectedArticle.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-5 h-5 ${favoriteIds.has(selectedArticle.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <ReadingControls
                settings={readingSettings}
                onSettingsChange={handleReadingSettingsChange}
                onToggleFocusMode={() => setFocusMode(false)}
              />
              <Button
                onClick={toggleDarkMode}
                size="icon"
                variant="ghost"
                className={darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
        <div className={`mx-auto py-12 px-6 ${maxWidthClasses[readingSettings.maxWidth]}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <article 
              className="lg:col-span-8 max-h-[80vh] overflow-y-auto"
              style={{
                fontFamily: readingSettings.fontFamily,
                fontSize: `${readingSettings.fontSize}px`,
                lineHeight: readingSettings.lineHeight
              }}
              onScroll={(e) => {
                handleArticleScroll(selectedArticle.id, e.target.scrollTop);
                handleScroll(e);
              }}
            >
              <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-2 mb-6">
                {selectedArticle.author && <Badge variant="outline">{selectedArticle.author}</Badge>}
                {selectedArticle.reading_time && <Badge variant="secondary">{selectedArticle.reading_time} min</Badge>}
              </div>
              <div 
                className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                style={{
                  color: darkMode ? '#e5e7eb' : '#1f2937'
                }}
              />
            </article>
            <aside className="lg:col-span-4 space-y-4">
              <div className={`sticky top-24 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <AnnotationTools articleId={selectedArticle.id} darkMode={darkMode} />
              </div>
              <ArticleFeedback 
                articleId={selectedArticle.id} 
                articleTitle={selectedArticle.title}
                darkMode={darkMode}
              />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className={`shadow-xl rounded-md p-4 sticky top-24 max-h-[80vh] overflow-auto ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
              <h2 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Guias</h2>
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  placeholder="Buscar guias..."
                  className={`pl-10 h-9 text-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                />
              </div>
              <div className="space-y-2">
                {filteredGuides.map((g) => (
                  <div key={g.id} className={`rounded border p-2 ${slug === g.page_key ? (darkMode ? 'border-indigo-500 bg-indigo-900/30' : 'border-indigo-500 bg-indigo-50') : (darkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-white hover:bg-gray-50')}`}>
                    <button className={`text-left w-full font-medium text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'} hover:${darkMode ? 'text-white' : 'text-black'}`} onClick={() => setSlug(g.page_key)}>
                      {(g.title || g.page_key).replaceAll('_', ' ')}
                    </button>
                    {guideArticlesMap[g.page_key]?.length > 0 && (
                      <ul className="mt-2 pl-3 space-y-1">
                        {guideArticlesMap[g.page_key].map((a) => (
                          <li key={a.id}>
                            <a href={`#art-${a.id}`} className={`text-xs ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600'}`}>
                              {a.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {filteredGuides.length === 0 && guides.length > 0 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum guia encontrado.</p>
                )}
                {guides.length === 0 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum guia criado ainda.</p>
                )}
              </div>
            </div>
          </aside>
          <section className="md:col-span-8 lg:col-span-9">
            <div className={`shadow-xl rounded-md p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isAdmin && (
              <div>
                {!editMode ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditMode(true)}
                    className={darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 hover:text-white' : ''}
                  >
                    Editar guia
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={content.title}
                      onChange={(e) => setContent({ ...content, title: e.target.value })}
                      placeholder="Título do guia"
                      className={darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}
                    />
                    <Textarea
                      value={content.subtitle}
                      onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                      placeholder="Descrição do guia"
                      rows={3}
                      className={darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveContent} className="bg-indigo-600 hover:bg-indigo-700 text-white">Salvar</Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        className={darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 hover:text-white' : ''}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ReadingControls
              settings={readingSettings}
              onSettingsChange={handleReadingSettingsChange}
              onToggleFocusMode={() => {}}
            />
            <Button
              onClick={toggleDarkMode}
              size="icon"
              variant="ghost"
              className={`${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <h1 className={`text-3xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{content.title}</h1>
        <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{content.subtitle}</p>

        {loading && <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Carregando conteúdo...</div>}

        {!loading && videos.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vídeos</h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  placeholder="Buscar vídeos..."
                  className={`pl-10 h-9 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-6">
              {filteredVideos.length === 0 ? (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum vídeo encontrado.</p>
              ) : (
                filteredVideos.map((v) => {
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
                      <Link to={createPageUrl(`AssistirAula?slug=${slug}&videoId=${id}`)}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 hover:text-white' : ''}
                        >
                          Assistir aula
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              }))}
            </div>
          </section>
        )}

        {!loading && articles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Artigos</h2>
                {favorites.length > 0 && (
                  <Button
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={showFavoritesOnly ? 'bg-red-500 hover:bg-red-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600' : '')}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    Favoritos ({favorites.length})
                  </Button>
                )}
              </div>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="Buscar artigos..."
                  className={`pl-10 h-9 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                />
              </div>
            </div>
            {filteredArticles.length === 0 ? (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum artigo encontrado.</p>
            ) : (
              filteredArticles.map((a) => (
              <div key={a.id} id={`art-${a.id}`} className={`relative p-6 rounded-lg mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      {a.author && <Badge variant="outline">{a.author}</Badge>}
                      {a.reading_time && <Badge variant="secondary">{a.reading_time} min</Badge>}
                      {readingProgress[a.id] && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <BookMarked className="w-3 h-3 mr-1" />
                          Continuar leitura
                        </Badge>
                      )}
                      {favoriteIds.has(a.id) && (
                        <Badge className="bg-red-100 text-red-800">
                          <Heart className="w-3 h-3 mr-1 fill-current" />
                          Favorito
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={favoriteIds.has(a.id) ? "default" : "outline"}
                      onClick={() => toggleFavorite(a)}
                      className={favoriteIds.has(a.id) ? 'bg-red-500 hover:bg-red-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600' : '')}
                      title={favoriteIds.has(a.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${favoriteIds.has(a.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedArticle(a);
                        setFocusMode(true);
                      }}
                      className={darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 hover:text-white' : ''}
                    >
                      Modo Foco
                    </Button>
                  </div>
                </div>
                <article 
                  className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}
                  style={{
                    fontFamily: readingSettings.fontFamily,
                    fontSize: `${readingSettings.fontSize}px`,
                    lineHeight: readingSettings.lineHeight
                  }}
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: a.content }}
                    style={{
                      color: darkMode ? '#e5e7eb' : '#1f2937'
                    }}
                  />
                </article>
                <hr className={`my-6 ${darkMode ? 'border-gray-700' : ''}`} />
              </div>
            )))}
          </section>
        )}

        {!loading && videos.length === 0 && articles.length === 0 && (
          <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Nenhum conteúdo marcado para este guia ainda.
            Marque artigos com a tag <b>{slug}</b> e vídeos com o tópico <b>{slug}</b>.
          </div>
        )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}