import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
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
      className="relative overflow-hidden rounded-[1.5rem] p-6 sm:p-10 lg:p-12"
      style={{
        background: `
          radial-gradient(circle at 18% 50%, rgba(139, 70, 255, 0.22), transparent 38%),
          radial-gradient(circle at 52% 65%, rgba(45, 120, 255, 0.18), transparent 40%),
          radial-gradient(circle at 82% 30%, rgba(236, 72, 153, 0.22), transparent 38%),
          linear-gradient(135deg, #11111f 0%, #18172b 48%, #21132b 100%)
        `,
        boxShadow: "0 8px 40px -12px rgba(139, 70, 255, 0.25)",
      }}
    >
      {/* Subtle 1px translucent purple border */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-purple-400/15" />

      {/* Nav arrows positioned near edges */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-black/60 hover:text-white sm:grid place-items-center"
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-black/60 hover:text-white sm:grid place-items-center"
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <div className="relative grid gap-10 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-14">
        {/* -------- Left content -------- */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-purple-200 ring-1 ring-purple-400/25">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
              Featured Today
            </span>
            {items.length > 1 && (
              <span className="text-[10px] font-medium tracking-wide text-white/35">
                {String(slide + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            )}
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {feature ? (
              <>
                {(() => {
                  const name = decode(feature.name);
                  const words = name.split(" ");
                  const mid = Math.ceil(words.length / 2);
                  const first = words.slice(0, mid).join(" ");
                  const last = words.slice(mid).join(" ");
                  return (
                    <span>
                      <span className="text-white">{first}</span>{" "}
                      <span className="bg-gradient-to-r from-pink-200 via-pink-100 to-white bg-clip-text text-transparent">{last}</span>
                    </span>
                  );
                })()}
              </>
            ) : (
              <span className="bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                Millions of songs, one tap away
              </span>
            )}
          </h1>

          {feature && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-[#b8b0cc] sm:text-base">
              {feature.album?.name && <span className="font-medium text-white/80">{decode(feature.album.name)}</span>}
              {feature.artists?.primary?.length ? (
                <span className="flex items-center gap-1">
                  <span className="text-white/20">&middot;</span>
                  {feature.artists.primary.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && <span className="text-white/15">, </span>}
                      <Link to="/artist/$id" params={{ id: a.id }} className="text-purple-300/80 hover:text-purple-200 transition-colors">
                        {a.name}
                      </Link>
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
          )}
          {!feature && !loading && (
            <p className="mt-3 max-w-xl text-sm text-[#b8b0cc] sm:text-base">
              Search any artist, album or track. RB Music streams instantly — no signup, no ads.
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              disabled={!songs.length}
              onClick={() => player.playList(songs, 0)}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/50 active:translate-y-0 active:scale-[0.97] disabled:opacity-40"
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
              className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 px-7 py-3 text-sm font-semibold text-white/85 shadow-lg backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-40"
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
          <div className="relative flex flex-col items-center">
            <div
              className="relative"
              style={{
                filter: "drop-shadow(0 0 40px rgba(236, 72, 153, 0.25)) drop-shadow(0 0 80px rgba(139, 70, 255, 0.15))",
              }}
            >
              <div
                className="h-48 w-48 overflow-hidden rounded-[1.25rem] ring-1 ring-white/15 lg:h-60 lg:w-60"
                style={{
                  boxShadow: "0 12px 48px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  transform: "translateY(0)",
                  transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute right-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  {slide + 1}/{items.length}
                </div>
              </div>
            </div>

            {/* Carousel indicators */}
            {items.length > 1 && (
              <div className="mt-5 flex items-center gap-2">
                {items.slice(0, Math.min(items.length, 6)).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === slide
                        ? "h-2 w-6 bg-gradient-to-r from-pink-500 to-purple-500 shadow-sm shadow-pink-400/30"
                        : "h-2 w-2 bg-white/20 hover:bg-white/40"
                    }`}
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
          <div className="h-5 w-52 animate-pulse rounded-full bg-white/8" />
          <div className="h-4 w-80 animate-pulse rounded-full bg-white/5" />
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
