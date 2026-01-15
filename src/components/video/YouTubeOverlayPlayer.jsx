import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

export default function YouTubeOverlayPlayer({ videoId, accentColor = "#6d28d9", className = "", style = {} }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const hostId = useMemo(() => `yt-player-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    // Load YT iframe API once
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    // Reset when video changes
    setShowOverlay(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (playerRef.current && videoId) {
      try { playerRef.current.cueVideoById(videoId); } catch {}
    }
  }, [videoId]);

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    if (playerRef.current?.destroy) playerRef.current.destroy();
  }, []);

  const startTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      setCurrentTime(playerRef.current.getCurrentTime?.() || 0);
      setDuration(playerRef.current.getDuration?.() || 0);
      setMuted(playerRef.current.isMuted?.() || false);
    }, 500);
  };

  const formatTime = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  };

  const initPlayer = () => {
    if (!videoId) return;
    const ensure = () => {
      if (window.YT && window.YT.Player) {
        const el = document.getElementById(hostId);
        if (!el) return;
        if (playerRef.current) {
          try {
            playerRef.current.loadVideoById(videoId);
            setShowOverlay(false);
            setPlaying(true);
            startTimer();
          } catch {}
          return;
        }
        playerRef.current = new window.YT.Player(el, {
          videoId,
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

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
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
    <div ref={containerRef} className={`relative w-full h-full ${className}`} style={style}>
      {/* Overlay + thumbnail */}
      {showOverlay && videoId && (
        <button onClick={initPlayer} className="absolute inset-0 group" aria-label="Reproduzir">
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="Vídeo"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full shadow-lg"
              style={{ width: 100, height: 100, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.85))' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12" style={{ color: accentColor }} />
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Player host */}
      <div id={hostId} className={`absolute inset-0 ${showOverlay ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity`} />

      {/* Controls */}
      {!showOverlay && (
        <div className="absolute inset-x-0 bottom-0 text-white">
          <div className="h-1 bg-white/20 cursor-pointer" onClick={handleSeek}>
            <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: accentColor }} />
          </div>
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
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => {
                const el = containerRef.current;
                if (!el) return;
                if (document.fullscreenElement) document.exitFullscreen();
                else el.requestFullscreen?.();
              }}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}