import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Article, YouTubeVideo, SiteContent, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Sun, Moon } from "lucide-react";

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

        setIsAdmin(!!user && (user.role === 'admin' || user.email === 'conectadoemconcursos@gmail.com' || user.email === 'jairochris1@gmail.com'));

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

  return (
    <div className={`min-h-screen py-8 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className={`shadow-xl rounded-md p-4 sticky top-24 max-h-[80vh] overflow-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
                  <div key={g.id} className={`rounded border p-2 ${slug === g.page_key ? (darkMode ? 'border-indigo-500 bg-indigo-900/30' : 'border-indigo-500 bg-indigo-50') : (darkMode ? 'border-gray-700' : 'border-gray-200')}`}>
                    <button className={`text-left w-full font-medium text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`} onClick={() => setSlug(g.page_key)}>
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
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
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
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={toggleDarkMode}
            size="icon"
            variant="ghost"
            className={`ml-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
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
                        <Button size="sm" variant="outline">Assistir aula</Button>
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
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Artigos</h2>
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
              <article key={a.id} id={`art-${a.id}`} className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {a.author && <Badge variant="outline">{a.author}</Badge>}
                  {a.reading_time && <Badge variant="secondary">{a.reading_time} min</Badge>}
                </div>
                <div 
                  className={darkMode ? 'text-gray-200' : ''} 
                  dangerouslySetInnerHTML={{ __html: a.content }}
                  style={{
                    color: 'inherit'
                  }}
                />
                <hr className={`my-6 ${darkMode ? 'border-gray-700' : ''}`} />
              </article>
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