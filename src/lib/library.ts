import type { SSong } from "./saavn";

const LIKES_KEY = "rbm:likes";
const PL_KEY = "rbm:playlists";
const DL_META_KEY = "rbm:downloads";

export type LocalPlaylist = { id: string; name: string; songs: SSong[]; createdAt: number };

type Bus = { listeners: Set<() => void> };
const bus: Bus = { listeners: new Set() };
export function subscribeLibrary(cb: () => void) {
  bus.listeners.add(cb);
  return () => bus.listeners.delete(cb);
}
function emit() {
  bus.listeners.forEach((l) => l());
}

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  emit();
}

// Likes
export const getLikes = (): SSong[] => read<SSong[]>(LIKES_KEY, []);
export const isLiked = (id: string) => getLikes().some((s) => s.id === id);
export function toggleLike(song: SSong) {
  const cur = getLikes();
  const next = cur.some((s) => s.id === song.id) ? cur.filter((s) => s.id !== song.id) : [song, ...cur];
  write(LIKES_KEY, next);
}

// Playlists
export const getPlaylists = (): LocalPlaylist[] => read<LocalPlaylist[]>(PL_KEY, []);
export function createPlaylist(name: string): LocalPlaylist {
  const p: LocalPlaylist = { id: `pl_${Date.now()}`, name, songs: [], createdAt: Date.now() };
  write(PL_KEY, [p, ...getPlaylists()]);
  return p;
}
export function deletePlaylist(id: string) {
  write(PL_KEY, getPlaylists().filter((p) => p.id !== id));
}
export function addSongToPlaylist(playlistId: string, song: SSong) {
  const pls = getPlaylists().map((p) =>
    p.id === playlistId && !p.songs.some((s) => s.id === song.id)
      ? { ...p, songs: [...p.songs, song] }
      : p,
  );
  write(PL_KEY, pls);
}
export function removeSongFromPlaylist(playlistId: string, songId: string) {
  const pls = getPlaylists().map((p) =>
    p.id === playlistId ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p,
  );
  write(PL_KEY, pls);
}

// Download metadata (blobs live in IndexedDB)
export const getDownloadMeta = (): SSong[] => read<SSong[]>(DL_META_KEY, []);
export function setDownloaded(song: SSong, on: boolean) {
  const cur = getDownloadMeta();
  const next = on
    ? cur.some((s) => s.id === song.id) ? cur : [song, ...cur]
    : cur.filter((s) => s.id !== song.id);
  write(DL_META_KEY, next);
}
export const isDownloadedMeta = (id: string) => getDownloadMeta().some((s) => s.id === id);