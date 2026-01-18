import { useEffect, useState } from "react";
import { Article, YouTubeVideo, SiteContent, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ComoEstudarPrimeiroLugar() {
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState({ title: "", subtitle: "" });
  const [contentId, setContentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guideArticlesMap, setGuideArticlesMap] = useState({});
  const [selectedGuide, setSelectedGuide] = useState('guia_aprovacao');

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

        const defaultTitle = "Como estudar para ser aprovado em primeiro lugar";
        const defaultSubtitle = "Guia prático com materiais selecionados para acelerar sua aprovação. Os itens abaixo são exibidos sem bloqueios, em um formato limpo, como uma folha A4.";
        const allGuides = (scAll || [])
          .filter(sc => typeof sc.page_key === 'string' && sc.page_key.toLowerCase().startsWith('guia_'))
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || (a.title || a.page_key).localeCompare(b.title || b.page_key));
        setGuides(allGuides);
        const existing = allGuides.find(g => g.page_key === 'guia_aprovacao') || null;
        if (existing) {
          setContent({ title: existing.title || defaultTitle, subtitle: existing.subtitle || defaultSubtitle });
          setContentId(existing.id);
        } else {
          setContent({ title: defaultTitle, subtitle: defaultSubtitle });
          setContentId(null);
        }

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
    <div className="min-h-screen bg-gray-100 py-4 md:py-8 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="md:hidden mb-4">
          <Select value={selectedGuide} onValueChange={setSelectedGuide}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione um guia" />
            </SelectTrigger>
            <SelectContent>
              {guides.map((g) => (
                <SelectItem key={g.id} value={g.page_key}>
                  {(g.title || g.page_key).replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="bg-white shadow-xl rounded-md p-4 sticky top-24 max-h-[80vh] overflow-auto">
              <h2 className="text-sm font-semibold mb-3 text-gray-700">Guias</h2>
              <div className="space-y-2">
                {guides.map((g) => (
                  <div key={g.id} className={`rounded border p-2 ${g.page_key === 'guia_aprovacao' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                    {g.page_key === 'guia_aprovacao' ? (
                      <div className="text-left w-full font-medium text-sm">
                        {(g.title || g.page_key).replaceAll('_', ' ')}
                      </div>
                    ) : (
                      <a className="block text-left w-full font-medium text-sm hover:text-indigo-700" href={createPageUrl(`GuiaEstudos?slug=${g.page_key}`)}>
                        {(g.title || g.page_key).replaceAll('_', ' ')}
                      </a>
                    )}
                    {guideArticlesMap[g.page_key]?.length > 0 && (
                      <ul className="mt-2 pl-3 space-y-1">
                        {guideArticlesMap[g.page_key].map((a) => (
                          <li key={a.id}>
                            {g.page_key === 'guia_aprovacao' ? (
                              <a href={`#art-${a.id}`} className="text-xs text-gray-600 hover:text-indigo-600">{a.title}</a>
                            ) : (
                              <a href={createPageUrl(`GuiaEstudos?slug=${g.page_key}#art-${a.id}`)} className="text-xs text-gray-600 hover:text-indigo-600">{a.title}</a>
                            )}
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
            <div className="bg-white shadow-xl rounded-md p-4 md:p-8">
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
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{content.title}</h1>
        <p className="text-sm md:text-base text-gray-600 mb-6">{content.subtitle}</p>

        {!loading && articles.some(a => a.is_featured) && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Recomendados</h2>
            <div className="space-y-4">
              {articles.filter(a => a.is_featured).map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <a href={`#art-${a.id}`} className="text-blue-700 font-semibold hover:underline">{a.title}</a>
                    {a.summary && <p className="text-sm text-gray-600 mt-1">{a.summary}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {loading && <div className="text-gray-700">Carregando conteúdo...</div>}

        {!loading && videos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Vídeos</h2>
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
            <h2 className="text-xl font-bold">Artigos</h2>
            {articles.map((a) => (
              <article key={a.id} id={`art-${a.id}`} className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-1">{a.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {a.author && <Badge variant="outline">{a.author}</Badge>}
                  {a.reading_time && <Badge variant="secondary">{a.reading_time} min</Badge>}
                </div>
                <div dangerouslySetInnerHTML={{ __html: a.content }} />
                <hr className="my-6" />
              </article>
            ))}
          </section>
        )}

        {!loading && videos.length === 0 && articles.length === 0 && (
          <div className="text-gray-600">
            Nenhum conteúdo marcado para este guia ainda.
            Marque artigos com a tag <b>guia_aprovacao</b> e vídeos com o tópico <b>guia_aprovacao</b>.
          </div>
        )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}