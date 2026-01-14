import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { YouTubeVideo, SiteContent } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";

export default function AssistirAula() {
  const [searchParams] = useSearchParams();
  const slug = (searchParams.get("slug") || "guia_aprovacao").toLowerCase();
  const initialVideoId = searchParams.get("videoId") || null;

  const [videos, setVideos] = useState([]);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState(initialVideoId);
  const [size, setSize] = useState("md"); // sm | md | lg
  const [accent, setAccent] = useState("#111827"); // default dark gray

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2] && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vids, scAll] = await Promise.all([
          YouTubeVideo.filter({ is_active: true }),
          SiteContent.list('-created_date', 500)
        ]);
        const guideItem = (scAll || []).find((s) => s.page_key?.toLowerCase() === slug);
        setGuide(guideItem || null);
        const list = (vids || [])
          .filter((v) => (v.topic || "").toLowerCase() === slug)
          .sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || (a.title || "").localeCompare(b.title || ""));
        setVideos(list);
        if (!initialVideoId && list.length > 0) {
          setCurrentId(list[0].video_id || extractYouTubeId(list[0].youtube_url));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const currentVideo = useMemo(() => {
    if (!currentId) return null;
    return videos.find(v => (v.video_id || extractYouTubeId(v.youtube_url)) === currentId) || null;
  }, [videos, currentId]);

  const playerHeightCls = {
    sm: "md:h-64",
    md: "md:h-96",
    lg: "md:h-[32rem]"
  }[size] || "md:h-96";

  const embedId = currentId;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">
              {guide?.title || slug.replaceAll('_',' ')}</h1>
            {guide?.subtitle && (
              <p className="text-sm text-gray-600">{guide.subtitle}</p>
            )}
          </div>
          <Link to={createPageUrl(`GuiaEstudos?slug=${slug}`)}>
            <Button variant="outline">Voltar ao guia</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-9">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Tamanho:</span>
                <Button size="sm" variant={size==='sm'? 'default':'outline'} onClick={() => setSize('sm')}>Pequeno</Button>
                <Button size="sm" variant={size==='md'? 'default':'outline'} onClick={() => setSize('md')}>Médio</Button>
                <Button size="sm" variant={size==='lg'? 'default':'outline'} onClick={() => setSize('lg')}>Grande</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Cor:</span>
                <div className="flex items-center gap-1">
                  {["#111827", "#4f46e5", "#16a34a", "#dc2626"].map(c => (
                    <button key={c} onClick={() => setAccent(c)} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} aria-label={`cor ${c}`} />
                  ))}
                </div>
                <Input type="color" value={accent} onChange={(e)=>setAccent(e.target.value)} className="h-8 w-12 p-1" />
              </div>
            </div>

            <Card style={{ borderColor: accent }} className="border-2 shadow-md">
              <CardContent className={`p-0 bg-black rounded ${playerHeightCls}`}>
                {loading ? (
                  <div className="h-64 md:h-full flex items-center justify-center text-white">Carregando vídeo...</div>
                ) : embedId ? (
                  <iframe
                    className="w-full h-64 md:h-full rounded"
                    src={`https://www.youtube.com/embed/${embedId}`}
                    title={currentVideo?.title || 'Aula'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ backgroundColor: accent }}
                  />
                ) : (
                  <div className="h-64 md:h-full flex items-center justify-center text-white">Selecione uma aula</div>
                )}
              </CardContent>
            </Card>

            {currentVideo && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold">{currentVideo.title}</h2>
                {currentVideo.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentVideo.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {currentVideo.duration && <Badge variant="secondary">{currentVideo.duration}</Badge>}
                  {currentVideo.instructor && <Badge variant="outline">Prof. {currentVideo.instructor}</Badge>}
                </div>
              </div>
            )}
          </section>

          <aside className="md:col-span-3">
            <Card>
              <CardContent className="p-3 space-y-2 max-h-[70vh] overflow-auto">
                <h3 className="text-sm font-semibold mb-1">Aulas</h3>
                {(videos || []).map((v) => {
                  const vid = v.video_id || extractYouTubeId(v.youtube_url);
                  const isActive = vid === embedId;
                  return (
                    <button key={v.id} onClick={() => setCurrentId(vid)}
                      className={`w-full text-left p-2 rounded border transition-colors ${isActive ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                      <div className="truncate font-medium text-sm">{v.title}</div>
                      {v.duration && <div className="text-xs text-gray-500">{v.duration}</div>}
                    </button>
                  );
                })}
                {videos.length === 0 && <div className="text-sm text-gray-500">Nenhuma aula encontrada.</div>}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}