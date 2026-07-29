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

/* ---------------- HOME (JioSaavn-style rows) ---------------- */

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
    <div className="space-y-10">
      <Hero songs={data?.trending ?? []} loading={loading} />

      {data?.trending?.length ? (
        <ExpandableSongList songs={data.trending} />
      ) : null}

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
    const id = setInterval(() => setSlide((s) => (s + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length]);

  const feature = items[slide] ?? songs[0];

  const goTo = (i: number) => setSlide(i);

  return (
    <section className="relative overflow-hidden rounded-[2rem] p-6 glass-strong sm:p-10">
      {feature && (
        <img
          src={pickImg(feature.image)}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-20 blur-3xl saturate-150"
        />
      )}
      <div className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 animate-pulse rounded-full bg-fuchsia-500/30 blur-[100px]" style={{ animationDuration: "4s" }} />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 animate-pulse rounded-full bg-indigo-500/30 blur-[100px]" style={{ animationDuration: "5s" }} />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-48 w-48 animate-pulse rounded-full bg-cyan-400/20 blur-[80px]" style={{ animationDuration: "6s" }} />
      <div className="relative grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-12">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200 ring-1 ring-fuchsia-500/30">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400" />
            Featured Today
          </p>
          <h1 className="mt-4 bg-gradient-to-r from-white via-fuchsia-100 to-indigo-200 bg-clip-text text-2xl font-bold leading-tight tracking-tight text-transparent sm:text-4xl">
            {feature ? decode(feature.name) : "Millions of songs, one tap away"}
          </h1>
          {feature && (
            <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/60 sm:text-base">
              {feature.album?.name && <span className="text-white/80">{decode(feature.album.name)}</span>}
              {feature.artists?.primary?.length ? (
                <span> &middot; {feature.artists.primary.map((a) => a.name).join(", ")}</span>
              ) : null}
            </p>
          )}
          {!feature && !loading && (
            <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/60 sm:text-base">
              Search any artist, album or track. RB Music streams instantly — no signup, no ads.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={!songs.length}
              onClick={() => player.playList(songs, 0)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20 transition hover:scale-[1.03] hover:shadow-fuchsia-500/50 active:scale-[0.98] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play Trending
            </button>
            <button
              disabled={!songs.length}
              onClick={() => {
                const shuffled = [...songs].sort(() => Math.random() - 0.5);
                player.playList(shuffled, 0);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/90 shadow-lg backdrop-blur-sm transition hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M4 20l16-16M21 16v5h-5M4 4l5 5m6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Shuffle
            </button>
          </div>
        </div>
        {items.length > 0 && (
          <div className="relative hidden shrink-0 sm:block">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 blur-2xl" />
            <div className="relative h-44 w-44 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/30 lg:h-56 lg:w-56">
              {items.map((s, i) => (
                <img
                  key={s.id}
                  src={pickImg(s.image)}
                  alt={decode(s.name)}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                    i === slide ? "scale-100 opacity-100" : "scale-110 opacity-0"
                  }`}
                />
              ))}
              <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                {slide + 1}/{items.length}
              </span>
            </div>
            {items.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {items.slice(0, Math.min(items.length, 6)).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === slide ? "w-5 bg-fuchsia-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {loading && !feature && (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-72 animate-pulse rounded bg-white/5" />
        </div>
      )}
    </section>
  );
}

function RowHeader({ title, viewAll, onToggle }: { title: string; viewAll?: boolean; onToggle?: () => void }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      {onToggle && (
        <button onClick={onToggle} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
          {viewAll ? "Show Less" : "View All"}
          <svg
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 transition ${viewAll ? "rotate-180" : ""}`}
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
                <div key={i} className="h-40 w-40 shrink-0 animate-pulse rounded-2xl bg-white/5 sm:h-44 sm:w-44" />
              ))
            : items}
        </div>
      )}
    </section>
  );
}

function ExpandableSongList({ songs }: { songs: SSong[] }) {
  const [viewAll, setViewAll] = useState(false);
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
      className="group w-40 shrink-0 snap-start sm:w-44"
    >
      <div className="aspect-square overflow-hidden rounded-3xl shadow-lg ring-1 ring-white/15 transition group-hover:-translate-y-1 group-hover:shadow-fuchsia-500/30 group-hover:ring-white/30">
        {pickImg(p.image) && (
          <img src={pickImg(p.image)} alt={decode(p.name)} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{decode(p.name)}</p>
      {p.songCount ? <p className="line-clamp-1 text-xs text-white/50">{p.songCount} songs</p> : null}
    </Link>
  );
}

function AlbumCard({ a }: { a: SAlbum }) {
  return (
    <Link to="/album/$id" params={{ id: a.id }} className="group w-40 shrink-0 snap-start sm:w-44">
      <div className="aspect-square overflow-hidden rounded-3xl shadow-lg ring-1 ring-white/15 transition group-hover:-translate-y-1 group-hover:shadow-fuchsia-500/30 group-hover:ring-white/30">
        {pickImg(a.image) && (
          <img src={pickImg(a.image)} alt={decode(a.name)} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{decode(a.name)}</p>
      <p className="line-clamp-1 text-xs text-white/50">
        {a.artists?.primary?.map((x) => x.name).join(", ") ?? a.year}
      </p>
    </Link>
  );
}

function ArtistCard({ a }: { a: SArtistFull }) {
  return (
    <Link to="/artist/$id" params={{ id: a.id }} className="group w-32 shrink-0 snap-start text-center sm:w-36">
      <div className="mx-auto aspect-square overflow-hidden rounded-full shadow-lg ring-1 ring-white/20 transition group-hover:-translate-y-1 group-hover:shadow-fuchsia-500/30 group-hover:ring-white/40">
        {pickImg(a.image) && (
          <img src={pickImg(a.image)} alt={decode(a.name)} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{decode(a.name)}</p>
      <p className="text-xs text-white/50">Artist</p>
    </Link>
  );
}

/* ---------------- SEARCH (kept when ?q= is set) ---------------- */

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
        {loading ? "Searching…" : `Results for "${query}"`}
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
        <p className="rounded-3xl p-8 text-center text-sm text-white/70 glass">
          No results found.
        </p>
      )}
    </div>
  );
}