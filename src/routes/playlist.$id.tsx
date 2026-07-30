import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SongList } from "@/components/SongList";
import { usePlayer } from "@/lib/player";
import { decode, getPlaylist, pickImg } from "@/lib/saavn";

export const Route = createFileRoute("/playlist/$id")({
  head: () => ({
    meta: [
      { title: "Playlist — RB Music" },
      { name: "description", content: "Play a featured JioSaavn playlist on RB Music." },
      { property: "og:title", content: "Playlist — RB Music" },
      { property: "og:description", content: "Featured playlist on RB Music." },
      { property: "og:type", content: "music.playlist" },
      { property: "og:url", content: "https://sachisagar5.github.io/rbmusic/playlist/$id" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Playlist — RB Music" },
      { name: "twitter:description", content: "Featured playlist on RB Music." },
    ],
  }),
  component: PlaylistPage,
  notFoundComponent: () => <p className="p-8 text-center text-white/60">Playlist not found.</p>,
  errorComponent: () => <p className="p-8 text-center text-white/60">Failed to load playlist.</p>,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const { data, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const p = await getPlaylist(id);
      if (!p) throw notFound();
      return p;
    },
  });

  useEffect(() => {
    if (data) {
      const name = decode(data.name);
      document.title = `${name} — Playlist on RB Music`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogTitle) ogTitle.setAttribute("content", `${name} — Playlist on RB Music`);
      if (ogDesc) ogDesc.setAttribute("content", `Playlist "${name}" featuring ${data.songCount || ""} songs on RB Music.`);
      const img = data.image ? (Array.isArray(data.image) ? data.image[0] : data.image) : null;
      if (ogImg && img) ogImg.setAttribute("content", img);
      document.getElementById("ld-json")?.remove();
      const script = document.createElement("script");
      script.id = "ld-json";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MusicPlaylist",
        name,
        url: `https://sachisagar5.github.io/rbmusic/playlist/${data.id}`,
        image: img,
        numTracks: data.songCount || data.songs?.length || 0,
      });
      document.head.appendChild(script);
    }
  }, [data]);

  if (isLoading) return <p className="text-white/50">Loading playlist…</p>;
  if (!data) return null;
  const songs = data.songs ?? [];

  return (
    <div>
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4 sm:gap-6">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-white/10 shadow-2xl sm:h-48 sm:w-48">
          <img src={pickImg(data.image)} alt={decode(data.name)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-fuchsia-300/80">Playlist</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-4xl">{decode(data.name)}</h1>
          {data.description && (
            <p className="mt-2 line-clamp-2 text-sm text-white/60">{decode(data.description)}</p>
          )}
          <p className="mt-2 text-sm text-white/60">{songs.length} songs</p>
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
              onClick={() => player.playList([...songs].sort(() => Math.random() - 0.5), 0)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              Shuffle
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8">
        {songs.length ? <SongList songs={songs} /> : <p className="text-white/50">No tracks in this playlist.</p>}
      </div>
    </div>
  );
}