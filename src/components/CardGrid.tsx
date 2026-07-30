import { Link } from "@tanstack/react-router";
import { decode, pickImg, type SImg } from "@/lib/saavn";
import { getAlbum, getPlaylist, getArtist } from "@/lib/saavn";
import { usePlayer } from "@/lib/player";
import { useDevice } from "@/lib/device";
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
  const dev = useDevice();
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

  const castItem = async (it: Item) => {
    if (!dev.activeDeviceId) return;
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
      if (songs.length && dev.activeDeviceId) {
        await dev.playOnDevice(dev.activeDeviceId, songs[0]);
        if (songs.length > 1) {
          for (let i = 1; i < songs.length; i++) {
            await dev.playOnDevice(dev.activeDeviceId, songs[i]);
          }
        }
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((it, i) => (
        <Link
          key={it.id}
          to={it.to}
          params={{ id: it.id }}
          className="group overflow-hidden rounded-[1.25rem] bg-white/[3%] p-3 ring-1 ring-white/[6%] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[5%] hover:ring-fuchsia-500/25 hover:shadow-lg hover:shadow-fuchsia-500/10 animate-in fade-in"
          style={{ animationDelay: `${(i % 10) * 50}ms` }}
        >
          <div className={`relative aspect-square overflow-hidden bg-white/10 ${it.round ? "rounded-full" : "rounded-xl"}`}>
            {pickImg(it.image) && (
              <img
                src={pickImg(it.image)}
                alt={decode(it.name)}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute left-2 top-2 flex gap-1.5">
              {!it.round && (
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  {it.to === "/album/$id" ? "Album" : it.to === "/playlist/$id" ? "Playlist" : "Artist"}
                </span>
              )}
            </div>
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
              <span className="grid h-12 w-12 translate-y-2 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-fuchsia-500/40 transition-all group-hover:translate-y-0 group-hover:shadow-fuchsia-500/60">
                {loadingId === it.id ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 ml-0.5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
            </button>
            {dev.activeDeviceId && (
              <button
                type="button"
                aria-label={`Push ${decode(it.name)} to device`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  castItem(it);
                }}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white/80 opacity-0 transition hover:bg-fuchsia-500/80 hover:text-white group-hover:opacity-100 focus:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-3 line-clamp-1 px-1 text-sm font-semibold text-white transition-colors group-hover:text-fuchsia-300">{decode(it.name)}</p>
          {it.subtitle && (
            <p className="mt-0.5 line-clamp-1 px-1 text-xs text-white/50">{it.subtitle}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
