import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SongList } from "@/components/SongList";
import { CardGrid } from "@/components/CardGrid";
import { usePlayer } from "@/lib/player";
import { decode, getArtist, pickImg } from "@/lib/saavn";

export const Route = createFileRoute("/artist/$id")({
  head: () => ({
    meta: [
      { title: "Artist — RB Music" },
      { name: "description", content: "Top songs, albums and more from this artist on RB Music." },
      { property: "og:title", content: "Artist — RB Music" },
      { property: "og:description", content: "Top songs and albums on RB Music." },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: "https://sachisagar5.github.io/rbmusic/artist/$id" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Artist — RB Music" },
      { name: "twitter:description", content: "Top songs and albums on RB Music." },
    ],
  }),
  component: ArtistPage,
  notFoundComponent: () => <p className="p-8 text-center text-white/60">Artist not found.</p>,
  errorComponent: () => <p className="p-8 text-center text-white/60">Failed to load artist.</p>,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const { data, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const a = await getArtist(id);
      if (!a) throw notFound();
      return a;
    },
  });

  useEffect(() => {
    if (data) {
      const name = decode(data.name);
      document.title = `${name} — Artist on RB Music`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogTitle) ogTitle.setAttribute("content", `${name} — Artist on RB Music`);
      if (ogDesc) ogDesc.setAttribute("content", `Top songs, albums and more from ${name} on RB Music.`);
      const img = data.image ? (Array.isArray(data.image) ? data.image[0] : data.image) : null;
      if (ogImg && img) ogImg.setAttribute("content", img);
      document.getElementById("ld-json")?.remove();
      const script = document.createElement("script");
      script.id = "ld-json";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        name,
        url: `https://sachisagar5.github.io/rbmusic/artist/${data.id}`,
        image: img,
        track: data.topSongs?.slice(0, 10)?.map((s) => ({
          "@type": "MusicRecording",
          name: decode(s.name),
          duration: s.duration,
        })),
      });
      document.head.appendChild(script);
    }
  }, [data]);

  if (isLoading) return <p className="text-white/50">Loading artist…</p>;
  if (!data) return null;
  const top = data.topSongs ?? [];
  const albums = data.topAlbums ?? [];

  return (
    <div>
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white/10 shadow-2xl sm:h-40 sm:w-40">
          <img src={pickImg(data.image)} alt={decode(data.name)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-fuchsia-300/80">Artist</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-4xl">{decode(data.name)}</h1>
          {data.followerCount != null && (
            <p className="mt-1 text-sm text-white/60">
              {Number(data.followerCount).toLocaleString()} listeners
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={!top.length}
              onClick={() => player.playList(top, 0)}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:opacity-40"
            >
              ▶ Play top songs
            </button>
          </div>
        </div>
      </header>

      {top.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Top songs</h2>
          <SongList songs={top} />
        </section>
      )}

      {albums.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Albums</h2>
          <CardGrid
            items={albums.map((a) => ({
              id: a.id,
              name: a.name,
              image: a.image,
              subtitle: a.year,
              to: "/album/$id" as const,
            }))}
          />
        </section>
      )}
    </div>
  );
}