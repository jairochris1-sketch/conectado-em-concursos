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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-md p-4 sticky top-24 max-h-[80vh] overflow-auto">
              <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">Guias</h2>
              <div className="space-y-2">
                {guides.map((g) => (
                  <div key={g.id} className={`rounded border p-2 ${slug === g.page_key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    <button className="text-left w-full font-medium text-sm text-gray-900 dark:text-gray-100" onClick={() => setSlug(g.page_key)}>
                      {(g.title || g.page_key).replaceAll('_', ' ')}
                    </button>
                    {guideArticlesMap[g.page_key]?.length > 0 && (
                      <ul className="mt-2 pl-3 space-y-1">
                        {guideArticlesMap[g.page_key].map((a) => (
                          <li key={a.id}>
                            <a href={`#art-${a.id}`} className="text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                              {a.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {guides.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum guia criado ainda.</p>
                )}
              </div>
            </div>
          </aside>
          <section className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-md p-8">
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
                  className="dark:bg-gray-700 dark:text-white"
                />
                <Textarea
                  value={content.subtitle}
                  onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                  placeholder="Descrição do guia"
                  rows={3}
                  className="dark:bg-gray-700 dark:text-white"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveContent} className="bg-indigo-600 hover:bg-indigo-700 text-white">Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">{content.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{content.subtitle}</p>

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
                      <Link to={createPageUrl(`AssistirAula?slug=${slug}&videoId=${id}`)}>
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
              <article key={a.id} id={`art-${a.id}`} className="prose prose-lg max-w-none dark:prose-invert">
                <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{a.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {a.author && <Badge variant="outline">{a.author}</Badge>}
                  {a.reading_time && <Badge variant="secondary">{a.reading_time} min</Badge>}
                </div>
                <div 
                  className="dark:text-gray-200" 
                  dangerouslySetInnerHTML={{ __html: a.content }}
                  style={{
                    color: 'inherit'
                  }}
                />
                <hr className="my-6 dark:border-gray-700" />
              </article>
            ))}
          </section>
        )}

        {!loading && videos.length === 0 && articles.length === 0 && (
          <div className="text-gray-600">
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