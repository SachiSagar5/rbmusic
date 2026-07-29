import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova — Stream Music You Love" },
      { name: "description", content: "Search and stream millions of songs instantly with Nova, a fast, beautiful music player." },
      { property: "og:title", content: "Nova — Stream Music You Love" },
      { property: "og:description", content: "Search and stream millions of songs instantly with Nova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const API = "https://saavn-api-sable.vercel.app/api";

type Artist = { id: string; name: string };
type Song = {
  id: string;
  name: string;
  duration: number;
  album: { name: string };
  artists: { primary: Artist[] };
  image: { quality: string; url: string }[];
  downloadUrl: { quality: string; url: string }[];
};

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const fmt = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const pickImg = (arr: Song["image"]) => arr?.find((i) => i.quality === "500x500")?.url ?? arr?.[arr.length - 1]?.url;
const pickAudio = (arr: Song["downloadUrl"]) =>
  arr?.find((i) => i.quality === "320kbps")?.url ?? arr?.find((i) => i.quality === "160kbps")?.url ?? arr?.[arr.length - 1]?.url;

const CHIPS = ["Trending", "Arijit Singh", "Weeknd", "Taylor Swift", "Lofi", "Bollywood", "Punjabi", "Dua Lipa"];

function Index() {
  const [query, setQuery] = useState("Trending");
  const [input, setInput] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`${API}/search/songs?query=${encodeURIComponent(query)}&limit=24`)
      .then((r) => r.json())
      .then((d) => {
        if (!ignore && d?.data?.results) setSongs(d.data.results);
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const play = (s: Song) => {
    setCurrent(s);
    setPlaying(true);
    setTimeout(() => {
      const a = audioRef.current;
      if (!a) return;
      const url = pickAudio(s.downloadUrl);
      if (!url) return;
      a.src = url;
      a.play().catch(() => setPlaying(false));
    }, 0);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const currentIdx = useMemo(
    () => (current ? songs.findIndex((s) => s.id === current.id) : -1),
    [current, songs],
  );
  const next = () => currentIdx >= 0 && currentIdx < songs.length - 1 && play(songs[currentIdx + 1]);
  const prev = () => currentIdx > 0 && play(songs[currentIdx - 1]);

  const seek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
  };

  const currentImg = current ? pickImg(current.image) : null;

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden bg-[#0b0714]">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-40 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nova</h1>
              <p className="text-xs text-white/50">Stream what you love</p>
            </div>
          </div>
          <a href="https://github.com/sumitkolhe/jiosaavn-api" target="_blank" rel="noreferrer"
             className="hidden text-xs text-white/60 hover:text-white sm:block">powered by jiosaavn-api ↗</a>
        </header>

        {/* Hero */}
        <section className="mt-14 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-300/80">Now playing everywhere</p>
          <h2 className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Millions of songs.
            <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              One tap to play.
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-white/60">
            Search any artist, album or track. Nova streams instantly — no signup, no ads.
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) setQuery(input.trim());
            }}
            className="mt-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl"
          >
            <svg viewBox="0 0 24 24" fill="none" className="ml-3 h-5 w-5 text-white/50">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search songs, artists, albums…"
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/40"
            />
            <button type="submit"
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110">
              Search
            </button>
          </form>

          {/* Chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => { setInput(c); setQuery(c); }}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  query === c
                    ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="mt-14">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">
              {loading ? "Searching…" : `Results for “${query}”`}
            </h3>
            <span className="text-xs text-white/40">{songs.length} tracks</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {songs.map((s) => {
                const img = pickImg(s.image);
                const isCurrent = current?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => play(s)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      {img && (
                        <img src={img} alt={decode(s.name)} loading="lazy"
                             className="h-full w-full object-cover transition group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className={`absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-xl shadow-fuchsia-500/40 transition ${isCurrent && playing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isCurrent && playing ? (
                          <svg viewBox="0 0 24 24" className="h-5 w-5"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 px-1">
                      <p className="line-clamp-1 text-sm font-semibold">{decode(s.name)}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                        {s.artists.primary.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Player */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0b0714]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
              {currentImg && <img src={currentImg} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold">
                {current ? decode(current.name) : "Nothing playing"}
              </p>
              <p className="line-clamp-1 text-xs text-white/50">
                {current ? current.artists.primary.map((a) => a.name).join(", ") : "Pick a track to start"}
              </p>
            </div>
          </div>

          <div className="flex flex-[2] flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button onClick={prev} disabled={currentIdx <= 0}
                className="text-white/70 transition hover:text-white disabled:opacity-30">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M6 6h2v12H6zM20 6v12l-10-6z" fill="currentColor"/></svg>
              </button>
              <button onClick={toggle} disabled={!current}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-30">
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                )}
              </button>
              <button onClick={next} disabled={currentIdx < 0 || currentIdx >= songs.length - 1}
                className="text-white/70 transition hover:text-white disabled:opacity-30">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z" fill="currentColor"/></svg>
              </button>
            </div>
            <div className="flex w-full max-w-xl items-center gap-2 text-[10px] text-white/50">
              <span className="w-9 text-right tabular-nums">{fmt(progress)}</span>
              <input
                type="range" min={0} max={duration || 0} value={progress} step={0.1}
                onChange={(e) => { const v = +e.target.value; setProgress(v); seek(v); }}
                className="h-1 flex-1 accent-fuchsia-400"
              />
              <span className="w-9 tabular-nums">{fmt(duration || (current?.duration ?? 0))}</span>
            </div>
          </div>

          <div className="hidden w-32 items-center gap-2 md:flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/50"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor"/></svg>
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => setVolume(+e.target.value)}
              className="h-1 flex-1 accent-fuchsia-400" />
          </div>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={next}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>
    </div>
  );
}
