import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/player";
import { decode, fmtTime, pickImg, type SSong } from "@/lib/saavn";
import {
  addSongToPlaylist,
  createPlaylist,
  getPlaylists,
  isLiked,
  setDownloaded,
  subscribeLibrary,
  toggleLike,
  isDownloadedMeta,
} from "@/lib/library";
import { hasBlob, putBlob, delBlob } from "@/lib/idb";
import { pickAudio } from "@/lib/saavn";
import { CastBtn } from "./CastBtn";
import { useDevice } from "@/lib/device";

function useLibVersion() {
  const [v, setV] = useState(0);
  useEffect(() => subscribeLibrary(() => setV((x) => x + 1)), []);
  return v;
}

async function downloadSong(song: SSong) {
  const url = pickAudio(song.downloadUrl);
  if (!url) throw new Error("No audio URL");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  await putBlob(song.id, blob);
  setDownloaded(song, true);
  saveBlobToDevice(blob, `${decode(song.name).replace(/[\\/:*?"<>|]+/g, " ").trim() || song.id}.mp3`);
}

function saveBlobToDevice(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* ignore */
  }
}

async function removeDownload(song: SSong) {
  await delBlob(song.id);
  setDownloaded(song, false);
}

export function SongList({
  songs,
  onExtraAction,
}: {
  songs: SSong[];
  onExtraAction?: (song: SSong) => React.ReactNode;
}) {
  const player = usePlayer();
  const dev = useDevice();
  const libV = useLibVersion();
  const [dlIds, setDlIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Record<string, "dl" | "err" | undefined>>({});

  const qlabel = (s: SSong) => {
    const has = (q: string) => s.downloadUrl?.some((u) => u.quality === q);
    if (has("320kbps")) return "HD";
    if (has("160kbps")) return "SD";
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all(songs.map(async (s) => ((await hasBlob(s.id)) ? s.id : null))).then((ids) => {
      if (cancelled) return;
      setDlIds(new Set(ids.filter(Boolean) as string[]));
    });
    return () => {
      cancelled = true;
    };
  }, [songs, libV]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {songs.map((s, i) => {
        const isCurrent = player.current?.id === s.id;
        const liked = isLiked(s.id);
        const downloaded = dlIds.has(s.id) || isDownloadedMeta(s.id);
        const state = busy[s.id];
        return (
          <div
            key={s.id}
            className={`group flex items-center gap-3 rounded-[1.25rem] px-3 py-2.5 transition-all duration-200 ${
              isCurrent
                ? "bg-gradient-to-r from-fuchsia-500/10 to-purple-500/5 ring-1 ring-fuchsia-500/20"
                : "hover:bg-white/[4%] ring-1 ring-transparent hover:ring-white/[6%]"
            }`}
            style={{ animationDelay: `${(i % 20) * 30}ms` }}
          >
            <div className="relative flex items-center gap-3 min-w-0 flex-1">
              <span className={`w-5 text-center text-xs font-medium tabular-nums ${
                isCurrent ? "text-fuchsia-400" : "text-white/30 group-hover:hidden"
              }`}>
                {isCurrent ? <span className="inline-block h-3 w-3 rounded-full bg-fuchsia-400 animate-pulse" /> : i + 1}
              </span>
              <span className="hidden group-hover:flex w-5 items-center justify-center">
                <button
                  onClick={() => player.playList(songs, i)}
                  className="text-white/70 hover:text-white transition"
                  aria-label={`Play ${decode(s.name)}`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </span>
              <button
                onClick={() => player.playList(songs, i)}
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10"
                aria-label={`Play ${decode(s.name)}`}
              >
                <img src={pickImg(s.image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className={`absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100 ${isCurrent ? "opacity-100" : ""}`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => player.playList(songs, i)}
                className="min-w-0 flex-1 text-left"
              >
                <p className={`line-clamp-1 text-sm font-semibold ${
                  isCurrent ? "text-fuchsia-300" : "text-white group-hover:text-white/90"
                }`}>
                  {decode(s.name)}
                </p>
                <p className="line-clamp-1 text-xs text-white/50">
                  {s.artists?.primary?.map((a, idx) => (
                    <span key={a.id}>
                      {idx > 0 && ", "}
                      <Link
                        to="/artist/$id"
                        params={{ id: a.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-white hover:underline"
                      >
                        {a.name}
                      </Link>
                    </span>
                  ))}
                </p>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="hidden text-xs tabular-nums text-white/40 sm:block">{fmtTime(s.duration)}</span>
              {qlabel(s) && (
                <span className="rounded-md bg-fuchsia-500/12 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-300 ring-1 ring-fuchsia-500/20">
                  {qlabel(s)}
                </span>
              )}
              <IconBtn
                title={liked ? "Unlike" : "Like"}
                onClick={() => toggleLike(s)}
                active={liked}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-4.35-9.5-8.5C.9 9.5 2.5 5 6.5 5c2 0 3.5 1.2 5.5 3.5C13.5 6.2 15 5 17 5c4 0 5.6 4.5 4 7.5C19 16.65 12 21 12 21z" />
                </svg>
              </IconBtn>
              <IconBtn
                title={downloaded ? "Remove download" : "Download"}
                active={downloaded}
                onClick={async () => {
                  if (downloaded) {
                    await removeDownload(s);
                    setDlIds((prev) => {
                      const nx = new Set(prev);
                      nx.delete(s.id);
                      return nx;
                    });
                  } else {
                    setBusy((b) => ({ ...b, [s.id]: "dl" }));
                    try {
                      await downloadSong(s);
                      setDlIds((prev) => new Set(prev).add(s.id));
                    } catch {
                      setBusy((b) => ({ ...b, [s.id]: "err" }));
                      setTimeout(() => setBusy((b) => ({ ...b, [s.id]: undefined })), 2500);
                      return;
                    }
                    setBusy((b) => ({ ...b, [s.id]: undefined }));
                  }
                }}
              >
                {state === "dl" ? (
                  <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : state === "err" ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v5m0 3v.01" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                ) : downloaded ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v12m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 20h16" strokeLinecap="round" />
                  </svg>
                )}
              </IconBtn>
              <AddToPlaylistMenu song={s} />
              <IconBtn title="Add to queue" onClick={() => player.addToQueue(s)}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h11M4 12h11M4 18h7M17 15v6m-3-3h6" strokeLinecap="round" />
                </svg>
              </IconBtn>
              <div className="hidden sm:block">
                <CastBtn onCast={() => { if (dev.activeDeviceId) dev.playOnDevice(dev.activeDeviceId, s); }} />
              </div>
              {onExtraAction?.(s)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`grid h-7 w-7 place-items-center rounded-lg transition-all ${
        active ? "text-fuchsia-400 bg-fuchsia-500/10" : "text-white/40 hover:bg-white/10 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function AddToPlaylistMenu({ song }: { song: SSong }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const libV = useLibVersion();
  const pls = getPlaylists();
  void libV;
  return (
    <div className="relative">
      <IconBtn title="Add to playlist" onClick={() => { setOpen((v) => !v); setCreating(false); }}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
        </svg>
      </IconBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setCreating(false); }} />
          <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-2xl glass-panel shadow-xl">
            {pls.length > 0 &&
              pls.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addSongToPlaylist(p.id, song);
                    setOpen(false);
                  }}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {p.name}
                </button>
              ))}
            {pls.length > 0 && <div className="mx-3 h-px bg-white/10" />}
            {creating ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = name.trim();
                  if (!v) return;
                  const p = createPlaylist(v);
                  addSongToPlaylist(p.id, song);
                  setName("");
                  setCreating(false);
                  setOpen(false);
                }}
                className="flex items-center gap-1.5 p-2"
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  className="min-w-0 flex-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fuchsia-300 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
                </svg>
                New playlist
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
