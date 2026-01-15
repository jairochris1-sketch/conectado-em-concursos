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

  const currentIndex = videos.findIndex(v => (v.video_id || extractYouTubeId(v.youtube_url)) === embedId);
  const hasNext = currentIndex >= 0 && currentIndex < videos.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = () => {
    if (hasNext) {
      const nextVideo = videos[currentIndex + 1];
      setCurrentId(nextVideo.video_id || extractYouTubeId(nextVideo.youtube_url));
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      const prevVideo = videos[currentIndex - 1];
      setCurrentId(prevVideo.video_id || extractYouTubeId(prevVideo.youtube_url));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Video Player */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-white">Carregando vídeo...</div>
            ) : embedId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${embedId}?rel=0`}
                title={currentVideo?.title || 'Aula'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">Selecione uma aula</div>
            )}
          </div>

          {/* Bottom Bar with Title and Navigation */}
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-white text-lg font-semibold">{currentVideo?.title || 'Selecione uma aula'}</h2>
                {currentVideo?.instructor && (
                  <p className="text-gray-400 text-sm mt-1">Prof. {currentVideo.instructor}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrev} 
                  disabled={!hasPrev}
                  className="text-white border-gray-600 hover:bg-gray-700"
                >
                  ← Anterior
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={goToNext} 
                  disabled={!hasNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <aside className="w-full lg:w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div className="sticky top-0 bg-gray-800 px-4 py-3 border-b border-gray-700 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Playlist do Curso</h3>
              <Link to={createPageUrl(`GuiaEstudos?slug=${slug}`)}>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  ← Voltar
                </Button>
              </Link>
            </div>
            {guide?.title && (
              <p className="text-gray-400 text-sm mt-1">{guide.title}</p>
            )}
          </div>

          <div className="p-2">
            {(videos || []).map((v, idx) => {
              const vid = v.video_id || extractYouTubeId(v.youtube_url);
              const isActive = vid === embedId;
              return (
                <button 
                  key={v.id} 
                  onClick={() => setCurrentId(vid)}
                  className={`w-full text-left p-3 mb-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                        {v.title}
                      </div>
                      {v.duration && (
                        <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                          {v.duration}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {videos.length === 0 && (
              <div className="text-center text-gray-500 py-8">Nenhuma aula encontrada.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}