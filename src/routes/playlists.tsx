import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { getPlaylists, subscribeLibrary } from "@/lib/library";
import { searchPlaylists, type SPlaylist } from "@/lib/saavn";

export const Route = createFileRoute("/playlists")({
  head: () => ({
    meta: [
      { title: "Playlists — RB Music" },
      { name: "description", content: "Browse featured playlists and manage your own local playlists on RB Music." },
      { property: "og:title", content: "Playlists — RB Music" },
      { property: "og:description", content: "Featured and personal playlists on RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistsPage,
});

const CATEGORIES = ["Trending", "Bollywood", "Punjabi", "Workout", "Chill", "Party", "Romance", "Lofi"];

function PlaylistsPage() {
  const [cat, setCat] = useState("Trending");
  const [featured, setFeatured] = useState<SPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [locals, setLocals] = useState(() => getPlaylists());

  useEffect(() => subscribeLibrary(() => setLocals(getPlaylists())), []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    searchPlaylists(cat, 18)
      .then((r) => {
        if (!ignore) setFeatured(r);
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [cat]);

  return (
    <div>
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Playlists</h1>
            <p className="mt-1 text-sm text-white/60">Curated for every mood — plus your own collections.</p>
          </div>
          <Link
            to="/library"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            Manage in Library
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                cat === c
                  ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <CardGrid
              items={featured.map((p) => ({
                id: p.id,
                name: p.name,
                image: p.image,
                subtitle: p.songCount ? `${p.songCount} songs` : undefined,
                to: "/playlist/$id" as const,
              }))}
            />
          )}
        </div>
      </section>

      {locals.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-white">Your playlists</h2>
          <ul className="grid gap-2">
            {locals.map((p) => (
              <li key={p.id}>
                <Link
                  to="/library"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/50">{p.songs.length} songs</p>
                  </div>
                  <span className="text-white/40">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}