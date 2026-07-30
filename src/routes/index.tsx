import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { SongList } from "@/components/SongList";
import { usePlayer } from "@/lib/player";
import {
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchSongs,
  decode,
  pickImg,
  type SAlbum,
  type SArtistFull,
  type SPlaylist,
  type SSong,
} from "@/lib/saavn";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  tab: fallback(z.string(), "songs").default("songs"),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "RB Music — Stream Music You Love" },
      { name: "description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:title", content: "RB Music — Stream Music You Love" },
      { property: "og:description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { q } = Route.useSearch();
  if (q && q.trim()) return <SearchView query={q.trim()} />;
  return <HomeView />;
}

type Home = {
  trending: SSong[];
  charts: SPlaylist[];
  newReleases: SAlbum[];
  bollywood: SPlaylist[];
  english: SPlaylist[];
  punjabi: SPlaylist[];
  romance: SPlaylist[];
  artists: SArtistFull[];
};

function HomeView() {
  const [data, setData] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([
      searchSongs("Trending", 20).catch(() => [] as SSong[]),
      searchPlaylists("Top Charts", 12).catch(() => [] as SPlaylist[]),
      searchAlbums("New Releases", 12).catch(() => [] as SAlbum[]),
      searchPlaylists("Bollywood Hits", 12).catch(() => [] as SPlaylist[]),
      searchPlaylists("English Top", 12).catch(() => [] as SPlaylist[]),
      searchPlaylists("Punjabi Hits", 12).catch(() => [] as SPlaylist[]),
      searchPlaylists("Romantic", 12).catch(() => [] as SPlaylist[]),
      searchArtists("Top Artists", 14).catch(() => [] as SArtistFull[]),
    ]).then(([trending, charts, newReleases, bollywood, english, punjabi, romance, artists]) => {
      if (ignore) return;
      setData({ trending, charts, newReleases, bollywood, english, punjabi, romance, artists });
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-10 pb-8">
      <Hero songs={data?.trending ?? []} loading={loading} />

      <ExpandableSongList songs={data?.trending ?? []} loading={loading} />

      <Row title="Top Charts" loading={loading}>
        {data?.charts.map((p) => (
          <PlaylistCard key={p.id} p={p} />
        ))}
      </Row>

      <Row title="New Releases" loading={loading}>
        {data?.newReleases.map((a) => (
          <AlbumCard key={a.id} a={a} />
        ))}
      </Row>

      <Row title="Bollywood Hits" loading={loading}>
        {data?.bollywood.map((p) => (
          <PlaylistCard key={p.id} p={p} />
        ))}
      </Row>

      <Row title="English Top" loading={loading}>
        {data?.english.map((p) => (
          <PlaylistCard key={p.id} p={p} />
        ))}
      </Row>

      <Row title="Popular Artists" loading={loading}>
        {data?.artists.map((a) => (
          <ArtistCard key={a.id} a={a} />
        ))}
      </Row>

      <Row title="Punjabi Hits" loading={loading}>
        {data?.punjabi.map((p) => (
          <PlaylistCard key={p.id} p={p} />
        ))}
      </Row>

      <Row title="Romantic Moods" loading={loading}>
        {data?.romance.map((p) => (
          <PlaylistCard key={p.id} p={p} />
        ))}
      </Row>
    </div>
  );
}

function Hero({ songs, loading }: { songs: SSong[]; loading: boolean }) {
  const player = usePlayer();
  const [slide, setSlide] = useState(0);
  const items = songs.slice(0, 8);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  const feature = items[slide] ?? songs[0];

  const prev = () => setSlide((s) => (s - 1 + items.length) % items.length);
  const next = () => setSlide((s) => (s + 1) % items.length);

  return (
    <section
      className="group relative overflow-hidden px-5 py-6 sm:px-8 sm:py-7"
      style={{
        borderRadius: 24,
        background: `
          radial-gradient(circle at 30% 48%, rgba(93, 43, 177, 0.20), transparent 38%),
          radial-gradient(circle at 58% 42%, rgba(156, 68, 255, 0.28), transparent 13%),
          radial-gradient(circle at 59% 68%, rgba(255, 28, 155, 0.34), transparent 12%),
          radial-gradient(circle at 82% 45%, rgba(191, 28, 148, 0.24), transparent 35%),
          linear-gradient(105deg, #090817 0%, #120b28 38%, #25103b 68%, #24051f 100%)
        `,
        border: "1px solid rgba(122, 91, 190, 0.18)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.48), 0 2px 0 rgba(122,70,210,0.15)",
        minHeight: 320,
      }}
    >
      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full sm:grid place-items-center opacity-0 transition-all duration-300 group-hover:opacity-100 hover:brightness-125 hover:shadow-lg hover:shadow-purple-500/20"
            style={{
              width: 40,
              height: 40,
              background: "rgba(42, 38, 67, 0.72)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 8px 25px rgba(0,0,0,0.22)",
            }}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#E4DFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full sm:grid place-items-center opacity-0 transition-all duration-300 group-hover:opacity-100 hover:brightness-125 hover:shadow-lg hover:shadow-purple-500/20"
            style={{
              width: 40,
              height: 40,
              background: "rgba(42, 38, 67, 0.72)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 8px 25px rgba(0,0,0,0.22)",
            }}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#E4DFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <div className="relative flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between" style={{ paddingLeft: 0 }}>
        {/* -------- Left content -------- */}
        <div className="min-w-0 max-w-md">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: "rgba(112, 39, 142, 0.38)",
                border: "1px solid rgba(194, 99, 255, 0.12)",
                color: "#D9A7FF",
                letterSpacing: "1.5px",
                boxShadow: "inset 0 0 12px rgba(194, 99, 255, 0.08)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D9A7FF" }} />
              Featured Today
            </span>
            {items.length > 1 && (
              <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(168, 125, 180, 0.42)" }}>
                {String(slide + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            )}
          </div>

          <h1
            className="mt-3 font-extrabold leading-none tracking-tight"
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              letterSpacing: "-1px",
              textShadow: "0 4px 18px rgba(0,0,0,0.25)",
            }}
          >
            {feature ? (
              <span
                style={{
                  background: "linear-gradient(90deg, #F8F7FF 0%, #F5E9FF 38%, #F3A1D2 68%, #EA4CAF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {decode(feature.name)}
              </span>
            ) : (
              <span
                style={{
                  background: "linear-gradient(90deg, #F8F7FF 0%, #F5E9FF 38%, #F3A1D2 68%, #EA4CAF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Millions of songs, one tap away
              </span>
            )}
          </h1>

          {feature && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm" style={{ color: "#B9B6CC", fontWeight: 500 }}>
              {feature.album?.name && <span className="font-medium" style={{ color: "#C8C4DC" }}>{decode(feature.album.name)}</span>}
              {feature.artists?.primary?.length ? (
                <span className="flex items-center gap-1">
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>&middot;</span>
                  {feature.artists.primary.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)" }}>, </span>}
                      <Link to="/artist/$id" params={{ id: a.id }} className="transition-colors hover:brightness-125" style={{ color: "#C4B5E6" }}>
                        {a.name}
                      </Link>
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
          )}
          {!feature && !loading && (
            <p className="mt-2 max-w-lg text-sm" style={{ color: "#8F8CA5", fontWeight: 500 }}>
              Search any artist, album or track. RB Music streams instantly — no signup, no ads.
            </p>
          )}

          {feature && feature.album?.name && (
            <p className="mt-1 text-xs" style={{ color: "#8F8CA5", fontWeight: 500 }}>
              The song everyone is vibing to right now.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={!songs.length}
              onClick={() => player.playList(songs, 0)}
              style={{
                height: 48,
                padding: "0 28px",
                borderRadius: 9999,
                background: "linear-gradient(135deg, #D83AE8 0%, #A82CFF 48%, #6D35F2 100%)",
                boxShadow: "0 8px 24px rgba(184, 49, 242, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: songs.length ? "pointer" : "not-allowed",
                opacity: songs.length ? 1 : 0.4,
                transition: "all 0.25s ease",
              }}
              className="inline-flex items-center gap-2"
              onMouseEnter={(e) => {
                if (songs.length) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(184, 49, 242, 0.5), inset 0 1px 1px rgba(255,255,255,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(184, 49, 242, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)";
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play Now
            </button>
            <button
              disabled={!songs.length}
              onClick={() => {
                const shuffled = [...songs].sort(() => Math.random() - 0.5);
                player.playList(shuffled, 0);
              }}
              style={{
                height: 48,
                padding: "0 28px",
                borderRadius: 9999,
                background: "rgba(38, 36, 64, 0.82)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#E0DDEA",
                fontSize: "0.9rem",
                fontWeight: 600,
                boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
                cursor: songs.length ? "pointer" : "not-allowed",
                opacity: songs.length ? 1 : 0.4,
                transition: "all 0.25s ease",
              }}
              className="inline-flex items-center gap-2"
              onMouseEnter={(e) => {
                if (songs.length) {
                  e.currentTarget.style.background = "rgba(65, 53, 95, 0.92)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(38, 36, 64, 0.82)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M4 20l16-16M21 16v5h-5M4 4l5 5m6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Shuffle
            </button>
          </div>
        </div>

        {/* -------- Right artwork -------- */}
        {items.length > 0 && (
          <div className="relative flex shrink-0 flex-col items-center">
            <div
              className="relative"
              style={{
                width: "clamp(160px, 18vw, 240px)",
                aspectRatio: "1 / 1",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 22px 55px rgba(0,0,0,0.42), 0 0 55px rgba(219, 46, 185, 0.16)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {items.map((s, i) => (
                <img
                  key={s.id}
                  src={pickImg(s.image)}
                  alt={decode(s.name)}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    i === slide ? "scale-100 opacity-100" : "scale-110 opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

              {/* Circular play button at lower-right */}
              <button
                onClick={() => player.playList(songs, slide)}
                className="absolute bottom-3 right-3 grid place-items-center transition hover:scale-105 active:scale-95"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.94)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
                  color: "#21142E",
                }}
                aria-label="Play"
              >
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

            {/* Carousel indicators */}
            {items.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                {items.slice(0, Math.min(items.length, 5)).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === slide ? 28 : 8,
                      height: 8,
                      background: i === slide
                        ? "linear-gradient(90deg, #A536E8, #E142B8)"
                        : "rgba(168, 125, 180, 0.42)",
                      boxShadow: i === slide ? "0 0 12px rgba(165, 54, 232, 0.35)" : "none",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && !feature && (
        <div className="mt-4 space-y-3">
          <div className="h-5 w-52 animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-4 w-80 animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      )}
    </section>
  );
}

function RowHeader({ title, viewAll, onToggle }: { title: string; viewAll?: boolean; onToggle?: () => void }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
      {onToggle && (
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/50 transition-all hover:bg-white/5 hover:text-white active:scale-95"
        >
          {viewAll ? "Show Less" : "View All"}
          <svg
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 transition-transform duration-200 ${viewAll ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Row({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  const [viewAll, setViewAll] = useState(false);
  const items = Array.isArray(children) ? children : [children];
  return (
    <section>
      <RowHeader title={title} viewAll={viewAll} onToggle={items.length > 6 ? () => setViewAll((v) => !v) : undefined} />
      {viewAll ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 w-40 shrink-0 animate-pulse rounded-2xl bg-white/[4%] sm:h-44 sm:w-44" />
              ))
            : items}
        </div>
      )}
    </section>
  );
}

function ExpandableSongList({ songs, loading }: { songs: SSong[]; loading: boolean }) {
  const [viewAll, setViewAll] = useState(false);
  if (loading) {
    return (
      <section>
        <RowHeader title="Trending Now" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/[3%] p-3 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-white/8" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-40 rounded bg-white/8" />
                <div className="h-2.5 w-24 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section>
      <RowHeader title="Trending Now" viewAll={viewAll} onToggle={songs.length > 8 ? () => setViewAll((v) => !v) : undefined} />
      <SongList songs={viewAll ? songs : songs.slice(0, 8)} />
    </section>
  );
}

function PlaylistCard({ p }: { p: SPlaylist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: p.id }}
      className="group relative w-40 shrink-0 snap-start sm:w-44"
    >
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5 ring-1 ring-white/8 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-fuchsia-500/30 group-hover:shadow-lg group-hover:shadow-fuchsia-500/15">
        {pickImg(p.image) && (
          <img src={pickImg(p.image)} alt={decode(p.name)} loading="lazy" className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-2 top-2">
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
            Playlist
          </span>
        </div>
        <div className="absolute right-2 bottom-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-fuchsia-500/90 text-white shadow-lg shadow-fuchsia-500/30 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="h-4 w-4 ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-1 px-1 text-sm font-semibold text-white transition-colors group-hover:text-fuchsia-300">{decode(p.name)}</p>
      {p.songCount ? <p className="px-1 line-clamp-1 text-xs text-white/50">{p.songCount} songs</p> : null}
    </Link>
  );
}

function AlbumCard({ a }: { a: SAlbum }) {
  return (
    <Link to="/album/$id" params={{ id: a.id }} className="group relative w-40 shrink-0 snap-start sm:w-44">
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5 ring-1 ring-white/8 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-fuchsia-500/30 group-hover:shadow-lg group-hover:shadow-fuchsia-500/15">
        {pickImg(a.image) && (
          <img src={pickImg(a.image)} alt={decode(a.name)} loading="lazy" className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-2 top-2">
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
            Album
          </span>
        </div>
        <div className="absolute right-2 bottom-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-fuchsia-500/90 text-white shadow-lg shadow-fuchsia-500/30 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="h-4 w-4 ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-1 px-1 text-sm font-semibold text-white transition-colors group-hover:text-fuchsia-300">{decode(a.name)}</p>
      <p className="px-1 line-clamp-1 text-xs text-white/50">
        {a.artists?.primary?.map((x) => x.name).join(", ") ?? a.year}
      </p>
    </Link>
  );
}

function ArtistCard({ a }: { a: SArtistFull }) {
  return (
    <Link to="/artist/$id" params={{ id: a.id }} className="group w-32 shrink-0 snap-start text-center sm:w-36">
      <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/8 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-fuchsia-500/30 group-hover:shadow-lg group-hover:shadow-fuchsia-500/15 sm:w-32">
        {pickImg(a.image) && (
          <img src={pickImg(a.image)} alt={decode(a.name)} loading="lazy" className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-500/90 text-white shadow-lg shadow-fuchsia-500/30 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-fuchsia-300">{decode(a.name)}</p>
      <p className="text-xs text-white/50">Artist</p>
    </Link>
  );
}

function SearchView({ query }: { query: string }) {
  const [songs, setSongs] = useState<SSong[]>([]);
  const [albums, setAlbums] = useState<SAlbum[]>([]);
  const [artists, setArtists] = useState<SArtistFull[]>([]);
  const [playlists, setPlaylists] = useState<SPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([
      searchSongs(query, 20).catch(() => [] as SSong[]),
      searchAlbums(query, 12).catch(() => [] as SAlbum[]),
      searchArtists(query, 12).catch(() => [] as SArtistFull[]),
      searchPlaylists(query, 12).catch(() => [] as SPlaylist[]),
    ]).then(([s, al, ar, pl]) => {
      if (ignore) return;
      setSongs(s);
      setAlbums(al);
      setArtists(ar);
      setPlaylists(pl);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [query]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {loading ? (
          <span className="flex items-center gap-3">
            Searching
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:300ms]" />
            </span>
          </span>
        ) : (
          <>Results for &ldquo;{query}&rdquo;</>
        )}
      </h1>

      {!!songs.length && (
        <section>
          <RowHeader title="Songs" />
          <SongList songs={songs.slice(0, 10)} />
        </section>
      )}

      {!!albums.length && (
        <Row title="Albums" loading={false}>
          {albums.map((a) => <AlbumCard key={a.id} a={a} />)}
        </Row>
      )}

      {!!artists.length && (
        <Row title="Artists" loading={false}>
          {artists.map((a) => <ArtistCard key={a.id} a={a} />)}
        </Row>
      )}

      {!!playlists.length && (
        <Row title="Playlists" loading={false}>
          {playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}
        </Row>
      )}

      {!loading && !songs.length && !albums.length && !artists.length && !playlists.length && (
        <div className="flex flex-col items-center justify-center rounded-[1.75rem] bg-white/[3%] p-12 text-center ring-1 ring-white/[6%]">
          <svg viewBox="0 0 24 24" className="mb-4 h-12 w-12 text-white/20" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m20 20-3-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-medium text-white/50">No results found for &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-xs text-white/30">Try searching for a different artist, album or song.</p>
        </div>
      )}
    </div>
  );
}
