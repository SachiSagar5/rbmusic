import { createFileRoute, notFound } from "@tanstack/react-router";
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
      { name: "twitter:card", content: "summary_large_image" },
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

  if (isLoading) return <p className="text-white/50">Loading artist…</p>;
  if (!data) return null;
  const top = data.topSongs ?? [];
  const albums = data.topAlbums ?? [];

  return (
    <div>
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white/10 shadow-2xl sm:h-40 sm:w-40">
          <img src={pickImg(data.image)} alt="" className="h-full w-full object-cover" />
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