import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { YouTubeVideo, SiteContent } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

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

  // Custom player state/refs
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  // Load YT Iframe API once
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, []);

  const formatTime = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2,'0');
    const ss = String(sec).padStart(2,'0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  };

  const startTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      setCurrentTime(playerRef.current.getCurrentTime() || 0);
      setDuration(playerRef.current.getDuration() || 0);
      setMuted(playerRef.current.isMuted?.() || false);
    }, 500);
  };

  const initPlayer = () => {
    if (!embedId) return;
    const ensure = () => {
      if (window.YT && window.YT.Player) {
        const el = document.getElementById('yt-player');
        if (!el) return;
        if (playerRef.current) {
          playerRef.current.loadVideoById(embedId);
          setShowOverlay(false);
          setPlaying(true);
          startTimer();
          return;
        }
        playerRef.current = new window.YT.Player(el, {
          videoId: embedId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: (e) => {
              setPlayerReady(true);
              e.target.playVideo();
              setPlaying(true);
              startTimer();
            },
            onStateChange: (e) => {
              const S = window.YT?.PlayerState;
              if (!S) return;
              if (e.data === S.PLAYING) setPlaying(true);
              if (e.data === S.PAUSED) setPlaying(false);
              if (e.data === S.ENDED) setPlaying(false);
            }
          }
        });
        setShowOverlay(false);
      } else {
        setTimeout(ensure, 200);
      }
    };
    ensure();
  };

  useEffect(() => {
    // when video changes
    if (!embedId) return;
    setShowOverlay(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    return () => {};
  }, [embedId]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isMuted()) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  const handleSeek = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const ratio = x / rect.width;
    playerRef.current.seekTo(ratio * duration, true);
    setCurrentTime(ratio * duration);
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

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
                <div ref={containerRef} className="relative w-full h-64 md:h-full rounded overflow-hidden">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">Carregando vídeo...</div>
                  ) : !embedId ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">Selecione uma aula</div>
                  ) : (
                    <>
                      {/* Overlay thumbnail + play */}
                      {showOverlay && (
                        <button
                          onClick={initPlayer}
                          className="absolute inset-0 group"
                          aria-label="Reproduzir"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${embedId}/hqdefault.jpg`}
                            alt={currentVideo?.title || 'Aula'}
                            className="w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="rounded-full shadow-lg"
                              style={{
                                width: '96px',
                                height: '96px',
                                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                              }}
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-10 h-10 text-[#6d28d9]" />
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* YT Player host */}
                      <div id="yt-player" className={`absolute inset-0 ${showOverlay ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity`} />

                      {/* Controls */}
                      {!showOverlay && (
                        <div className="absolute inset-x-0 bottom-0 text-white">
                          {/* progress */}
                          <div
                            className="h-1 bg-white/20 cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div
                              className="h-full"
                              style={{ width: `${progressPct}%`, backgroundColor: accent }}
                            />
                          </div>

                          {/* bar */}
                          <div className="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur">
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={togglePlay}>
                                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={toggleMute}>
                                <Volume2 className={`w-4 h-4 ${muted ? 'opacity-40' : ''}`} />
                              </Button>
                              <span className="text-xs tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => {
                              const el = containerRef.current;
                              if (!el) return;
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              } else {
                                el.requestFullscreen?.();
                              }
                            }}>
                              <Maximize className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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