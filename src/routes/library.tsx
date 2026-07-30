import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SongList } from "@/components/SongList";
import { usePlayer } from "@/lib/player";
import {
  createPlaylist,
  deletePlaylist,
  getDownloadMeta,
  getLikes,
  getPlaylists,
  removeSongFromPlaylist,
  subscribeLibrary,
  type LocalPlaylist,
} from "@/lib/library";
import { allKeys } from "@/lib/idb";
import type { SSong } from "@/lib/saavn";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your Library — RB Music" },
      { name: "description", content: "Your liked songs, personal playlists and offline downloads on RB Music." },
      { property: "og:title", content: "Your Library — RB Music" },
      { property: "og:description", content: "Liked songs, playlists and offline downloads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

type Tab = "liked" | "playlists" | "downloads";

function LibraryPage() {
  const [tab, setTab] = useState<Tab>("liked");
  const [likes, setLikes] = useState<SSong[]>(() => getLikes());
  const [pls, setPls] = useState<LocalPlaylist[]>(() => getPlaylists());
  const [downloads, setDownloads] = useState<SSong[]>(() => getDownloadMeta());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => {
      setLikes(getLikes());
      setPls(getPlaylists());
      setDownloads(getDownloadMeta());
    };
    return subscribeLibrary(refresh);
  }, []);

  useEffect(() => {
    allKeys().then((k) => setDownloadedIds(new Set(k)));
  }, [downloads]);

  const validDownloads = downloads.filter((s) => downloadedIds.has(s.id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Your Library</h1>
      <p className="mt-1 text-sm text-white/60">Everything you like, save and download lives here.</p>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["liked", `Liked (${likes.length})`],
            ["playlists", `Playlists (${pls.length})`],
            ["downloads", `Downloads (${validDownloads.length})`],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === k ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "liked" && (
          likes.length ? <SongList songs={likes} /> : <Empty label="No liked songs yet. Tap the heart on any track." />
        )}
        {tab === "playlists" && <PlaylistsTab playlists={pls} />}
        {tab === "downloads" && (
          validDownloads.length ? <SongList songs={validDownloads} /> : <Empty label="No downloads yet. Tap the download icon on any song." />
        )}
      </div>
    </div>
  );
}

function PlaylistsTab({ playlists }: { playlists: LocalPlaylist[] }) {
  const player = usePlayer();
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    const p = createPlaylist(v);
    setName("");
    setOpenId(p.id);
  };

  return (
    <div>
      <form onSubmit={create} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name…"
          className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Create
        </button>
      </form>

      {playlists.length === 0 ? (
        <div className="mt-6">
          <Empty label="Create your first playlist above, then add songs from anywhere." />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {playlists.map((p) => {
            const expanded = openId === p.id;
            return (
              <li key={p.id} className="rounded-2xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => setOpenId(expanded ? null : p.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/50">{p.songs.length} songs</p>
                  </button>
                  <button
                    disabled={!p.songs.length}
                    onClick={() => player.playList(p.songs, 0)}
                    className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:scale-105 disabled:opacity-30"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) deletePlaylist(p.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                    aria-label="Delete playlist"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                {expanded && (
                  <div className="border-t border-white/10 p-3">
                    {p.songs.length ? (
                      <SongList
                        songs={p.songs}
                        onExtraAction={(s) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSongFromPlaylist(p.id, s.id);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                            aria-label="Remove from playlist"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      />
                    ) : (
                      <p className="p-4 text-center text-sm text-white/50">
                        Empty. Add songs by tapping the + icon on any track.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
      {label}
    </p>
  );
}