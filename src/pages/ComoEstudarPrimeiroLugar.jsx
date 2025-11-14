import { useEffect, useState } from "react";
import { Article, YouTubeVideo } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComoEstudarPrimeiroLugar() {
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const arts = await Article.filter({ is_published: true });
        const vids = await YouTubeVideo.filter({ is_active: true });
        setArticles((arts || []).filter(a => Array.isArray(a.tags) && a.tags.map(t => (t || "").toLowerCase()).includes("guia_aprovacao")));
        setVideos((vids || []).filter(v => (v.topic || "").toLowerCase() === "guia_aprovacao"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="mx-auto bg-white shadow-xl rounded-md p-8" style={{ maxWidth: "794px" }}>
        <h1 className="text-3xl font-extrabold mb-2">Como estudar para ser aprovado em primeiro lugar</h1>
        <p className="text-gray-600 mb-6">
          Guia prático com materiais selecionados para acelerar sua aprovação. 
          Os itens abaixo são exibidos sem bloqueios, em um formato limpo, como uma folha A4.
        </p>

        {loading && <div className="text-gray-700">Carregando conteúdo...</div>}

        {!loading && videos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Vídeos</h2>
            <div className="space-y-6">
              {videos.map((v) => {
                const id = v.video_id || extractYouTubeId(v.youtube_url);
                return (
                  <div key={v.id} className="w-full aspect-video bg-black rounded">
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
                );
              })}
            </div>
          </section>
        )}

        {!loading && articles.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold">Artigos</h2>
            {articles.map((a) => (
              <article key={a.id} className="prose max-w-none">
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
    </div>
  );
}