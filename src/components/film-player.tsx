import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

export type Chapter = { id: string; t: number; title: string };

const FALLBACK_CHAPTERS: Chapter[] = [
  { id: "wait", t: 2.4, title: "The wait" },
  { id: "red", t: 8.4, title: "The red light" },
  { id: "person", t: 14.5, title: "A person waiting" },
  { id: "offer", t: 20.5, title: "A different way" },
  { id: "device", t: 26.6, title: "VeinVision" },
  { id: "see", t: 32.6, title: "Seeing clearly" },
  { id: "ease", t: 40.1, title: "At ease" },
  { id: "how", t: 46.1, title: "The device" },
  { id: "message", t: 52.6, title: "The message" },
];

export function FilmPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [started, setStarted] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(FALLBACK_CHAPTERS);
  const [hovering, setHovering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/video/chapters.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.chapters?.length) {
          setChapters(data.chapters);
          if (typeof data.duration === "number") setDuration(data.duration);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onTime = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setTime(v.currentTime);
    if (v.duration && Number.isFinite(v.duration)) setDuration(v.duration);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      setStarted(true);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);
    v.addEventListener("loadedmetadata", onTime);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("loadedmetadata", onTime);
    };
  }, [onTime]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    setStarted(true);
    void v.play();
  }, []);

  const toggleFs = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFs(false);
    } else {
      void el.requestFullscreen();
      setFs(true);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "m") {
        setMuted((m) => !m);
      } else if (e.key === "f") {
        toggleFs();
      } else if (e.key === "ArrowRight") {
        seek((videoRef.current?.currentTime ?? 0) + 5);
      } else if (e.key === "ArrowLeft") {
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, v.currentTime - 5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seek, toggle, toggleFs]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const active = [...chapters].reverse().find((c) => time + 0.05 >= c.t) ?? chapters[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <div
        ref={wrapRef}
        className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-ink shadow-[0_24px_80px_-32px_rgba(28,27,25,0.55)]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(playing ? false : true)}
      >
        <div className="relative aspect-video w-full bg-ink">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster="/video/poster.jpg"
            playsInline
            preload="auto"
            muted={muted}
            onClick={toggle}
          >
            <source src="/video/veinvision.mp4" type="video/mp4" />
          </video>

          {!started && (
            <button
              type="button"
              onClick={toggle}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/25 text-paper"
              aria-label="Play film"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-paper text-ink shadow-lg transition-transform duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] hover:scale-105">
                <Play className="ml-1 h-8 w-8 fill-current" />
              </span>
              <span className="font-display text-xl italic tracking-tight text-paper md:text-2xl">
                Play the film
              </span>
            </button>
          )}

          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pt-16 transition-opacity duration-[var(--motion-fast)]",
              hovering || !playing ? "opacity-100" : "opacity-0",
            )}
          />

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-3 pt-2 transition-opacity duration-[var(--motion-fast)] md:px-4 md:pb-4",
              hovering || !playing ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="px-1">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.05}
                value={time}
                aria-label="Seek"
                onChange={(e) => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.currentTime = Number(e.target.value);
                  setTime(v.currentTime);
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper/25 accent-vein [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper"
                style={{
                  background: `linear-gradient(to right, var(--color-vein) ${pct}%, rgba(246,243,236,0.25) ${pct}%)`,
                }}
              />
            </div>
            <div className="flex items-center gap-1 text-paper md:gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="ml-1 min-w-[4.6rem] font-sans text-xs tabular-nums text-paper/80">
                {formatTime(time)} / {formatTime(duration)}
              </span>
              <span className="ml-2 hidden truncate font-display text-sm italic text-paper/80 sm:block">
                {active?.title}
              </span>
              <div className="ml-auto flex items-center">
                <a
                  href="/video/veinvision.mp4"
                  download="VeinVision-SIA.mp4"
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10"
                  aria-label="Download film"
                >
                  <Download className="h-5 w-5" />
                </a>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10"
                  onClick={toggleFs}
                  aria-label={fs ? "Exit fullscreen" : "Fullscreen"}
                >
                  {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="Scenes" className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chapters
          .filter((c) => c.id !== "title")
          .map((c) => {
            const on = active?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => seek(c.t + 0.05)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-left text-xs font-medium transition-colors duration-[var(--motion-fast)]",
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
                )}
              >
                {c.title}
              </button>
            );
          })}
      </nav>
    </div>
  );
}
