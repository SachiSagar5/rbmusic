import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SongList } from "@/components/SongList";
import { CardGrid } from "@/components/CardGrid";
import {
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchSongs,
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
      { property: "og:description", content: "Search and stream millions of songs instantly with RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CHIPS = ["Trending", "Arijit Singh", "Weeknd", "Taylor Swift", "Lofi", "Bollywood", "Punjabi", "Dua Lipa"];
const TABS = [
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
  { id: "playlists", label: "Playlists" },
] as const;

function Index() {
  const { q, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = q || "Trending";
  const activeTab = (["songs", "albums", "artists", "playlists"] as const).includes(tab as (typeof TABS)[number]["id"])
    ? (tab as (typeof TABS)[number]["id"])
    : "songs";

  const [songs, setSongs] = useState<SSong[]>([]);
  const [albums, setAlbums] = useState<SAlbum[]>([]);
  const [artists, setArtists] = useState<SArtistFull[]>([]);
  const [playlists, setPlaylists] = useState<SPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([
      searchSongs(query, 24).catch(() => [] as SSong[]),
      searchAlbums(query, 18).catch(() => [] as SAlbum[]),
      searchArtists(query, 18).catch(() => [] as SArtistFull[]),
      searchPlaylists(query, 18).catch(() => [] as SPlaylist[]),
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
    <div>
      <section className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-300/80">Now playing everywhere</p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Millions of songs.
          <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            One tap to play.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-sm text-white/60 sm:text-base">
          Search any artist, album or track. RB Music streams instantly — no signup, no ads.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => navigate({ search: { q: c, tab: activeTab } })}
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

      <section className="mt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="truncate pr-3 text-base font-semibold sm:text-lg">
            {loading ? "Searching…" : `Results for "${query}"`}
          </h2>
        </div>

        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate({ search: { q: query, tab: t.id } })}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                activeTab === t.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : activeTab === "songs" ? (
          songs.length ? <SongList songs={songs} /> : <Empty label="No songs found." />
        ) : activeTab === "albums" ? (
          albums.length ? (
            <CardGrid
              items={albums.map((a) => ({
                id: a.id,
                name: a.name,
                image: a.image,
                subtitle: a.artists?.primary?.map((x) => x.name).join(", ") ?? a.year,
                to: "/album/$id" as const,
              }))}
            />
          ) : <Empty label="No albums found." />
        ) : activeTab === "artists" ? (
          artists.length ? (
            <CardGrid
              items={artists.map((a) => ({
                id: a.id,
                name: a.name,
                image: a.image,
                to: "/artist/$id" as const,
                round: true,
              }))}
            />
          ) : <Empty label="No artists found." />
        ) : (
          playlists.length ? (
            <CardGrid
              items={playlists.map((p) => ({
                id: p.id,
                name: p.name,
                image: p.image,
                subtitle: p.songCount ? `${p.songCount} songs` : undefined,
                to: "/playlist/$id" as const,
              }))}
            />
          ) : <Empty label="No playlists found." />
        )}
      </section>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">{label}</p>;
}