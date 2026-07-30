import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SongList } from "@/components/SongList";
import { usePlayer } from "@/lib/player";
import { decode, getAlbum, pickImg } from "@/lib/saavn";

export const Route = createFileRoute("/album/$id")({
  head: () => ({
    meta: [
      { title: "Album — RB Music" },
      { name: "description", content: "Browse and play the full tracklist of this album on RB Music." },
      { property: "og:title", content: "Album — RB Music" },
      { property: "og:description", content: "Full album tracklist on RB Music." },
      { property: "og:type", content: "music.album" },
      { property: "og:url", content: "https://sachisagar5.github.io/rbmusic/album/$id" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Album — RB Music" },
      { name: "twitter:description", content: "Full album tracklist on RB Music." },
    ],
  }),
  component: AlbumPage,
  notFoundComponent: () => <p className="p-8 text-center text-white/60">Album not found.</p>,
  errorComponent: () => <p className="p-8 text-center text-white/60">Failed to load album.</p>,
});

function AlbumPage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const { data, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: async () => {
      const a = await getAlbum(id);
      if (!a) throw notFound();
      return a;
    },
  });

  useEffect(() => {
    if (data) {
      const name = decode(data.name);
      document.title = `${name} — Album on RB Music`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogTitle) ogTitle.setAttribute("content", `${name} — Album on RB Music`);
      if (ogDesc) ogDesc.setAttribute("content", `Full album "${name}" tracklist on RB Music.`);
      const img = data.image ? (Array.isArray(data.image) ? data.image[0] : data.image) : null;
      if (ogImg && img) ogImg.setAttribute("content", img);
      document.getElementById("ld-json")?.remove();
      const script = document.createElement("script");
      script.id = "ld-json";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MusicAlbum",
        name,
        url: `https://sachisagar5.github.io/rbmusic/album/${data.id}`,
        image: img,
        byArtist: data.artists?.primary?.map((a) => ({ "@type": "MusicGroup", name: a.name })),
        numberOfTracks: data.songs?.length || 0,
        datePublished: data.year ? String(data.year) : undefined,
      });
      document.head.appendChild(script);
    }
  }, [data]);

  if (isLoading) return <p className="text-white/50">Loading album…</p>;
  if (!data) return null;
  const songs = data.songs ?? [];

  return (
    <div>
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4 sm:gap-6">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-white/10 shadow-2xl sm:h-48 sm:w-48">
          <img src={pickImg(data.image)} alt={decode(data.name)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-fuchsia-300/80">Album</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-4xl">{decode(data.name)}</h1>
          <p className="mt-2 text-sm text-white/60">
            {data.artists?.primary?.map((a) => a.name).join(", ")}
            {data.year ? ` · ${data.year}` : ""}
            {songs.length ? ` · ${songs.length} songs` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={!songs.length}
              onClick={() => player.playList(songs, 0)}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:opacity-40"
            >
              ▶ Play
            </button>
            <button
              disabled={!songs.length}
              onClick={() => {
                const shuffled = [...songs].sort(() => Math.random() - 0.5);
                player.playList(shuffled, 0);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              Shuffle
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8">
        {songs.length ? <SongList songs={songs} /> : <p className="text-white/50">No tracks available.</p>}
      </div>
    </div>
  );
}