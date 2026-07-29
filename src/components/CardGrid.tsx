import { Link } from "@tanstack/react-router";
import { decode, pickImg, type SImg } from "@/lib/saavn";
import { getAlbum, getPlaylist, getArtist } from "@/lib/saavn";
import { usePlayer } from "@/lib/player";
import { useState } from "react";

type Item = {
  id: string;
  name: string;
  image: SImg[];
  subtitle?: string;
  to: "/album/$id" | "/artist/$id" | "/playlist/$id";
  round?: boolean;
};

export function CardGrid({ items }: { items: Item[] }) {
  const player = usePlayer();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const playItem = async (it: Item) => {
    try {
      setLoadingId(it.id);
      let songs: any[] = [];
      if (it.to === "/album/$id") {
        const a = await getAlbum(it.id);
        songs = a.songs ?? [];
      } else if (it.to === "/playlist/$id") {
        const p = await getPlaylist(it.id);
        songs = p.songs ?? [];
      } else if (it.to === "/artist/$id") {
        const a = await getArtist(it.id);
        songs = a.topSongs ?? [];
      }
      if (songs.length) player.playList(songs, 0);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((it) => (
        <Link
          key={it.id}
          to={it.to}
          params={{ id: it.id }}
          className="group overflow-hidden rounded-3xl p-3 glass transition hover:-translate-y-1"
        >
          <div className={`relative aspect-square overflow-hidden bg-white/10 ${it.round ? "rounded-full" : "rounded-xl"}`}>
            {pickImg(it.image) && (
              <img
                src={pickImg(it.image)}
                alt={decode(it.name)}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            )}
            <button
              type="button"
              aria-label={`Play ${decode(it.name)}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playItem(it);
              }}
              className={`absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100 focus:opacity-100 ${it.round ? "rounded-full" : ""}`}
            >
              <span className="grid h-12 w-12 translate-y-2 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-xl shadow-fuchsia-500/40 transition group-hover:translate-y-0">
                {loadingId === it.id ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
          <p className="mt-3 line-clamp-1 px-1 text-sm font-semibold text-white">{decode(it.name)}</p>
          {it.subtitle && (
            <p className="mt-0.5 line-clamp-1 px-1 text-xs text-white/50">{it.subtitle}</p>
          )}
        </Link>
      ))}
    </div>
  );
}