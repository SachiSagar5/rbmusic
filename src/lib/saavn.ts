export const SAAVN_API = "https://saavn-api-sable.vercel.app/api";

export type SImg = { quality: string; url: string };
export type SUrl = { quality: string; url: string };
export type SArtist = { id: string; name: string; role?: string; image?: SImg[] };

export type SSong = {
  id: string;
  name: string;
  duration: number;
  album: { id?: string; name: string };
  artists: { primary: SArtist[]; featured?: SArtist[]; all?: SArtist[] };
  image: SImg[];
  downloadUrl: SUrl[];
};

export type SAlbum = {
  id: string;
  name: string;
  year?: string;
  songCount?: number;
  language?: string;
  image: SImg[];
  artists?: { primary: SArtist[] };
  songs?: SSong[];
};

export type SArtistFull = {
  id: string;
  name: string;
  image: SImg[];
  followerCount?: number;
  topSongs?: SSong[];
  topAlbums?: SAlbum[];
};

export type SPlaylist = {
  id: string;
  name: string;
  description?: string;
  image: SImg[];
  songCount?: number;
  songs?: SSong[];
};

export const decode = (s: string) =>
  (s ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export const fmtTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export const pickImg = (arr?: SImg[]) =>
  arr?.find((i) => i.quality === "500x500")?.url ?? arr?.[arr.length - 1]?.url ?? "";

export const pickAudio = (arr?: SUrl[]) =>
  arr?.find((i) => i.quality === "320kbps")?.url ??
  arr?.find((i) => i.quality === "160kbps")?.url ??
  arr?.[arr.length - 1]?.url ??
  "";

const REQ_TIMEOUT = 20000;

async function j<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQ_TIMEOUT);
  try {
    const r = await fetch(`${SAAVN_API}${path}`, { signal: controller.signal });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    return d?.data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const searchSongs = (q: string, limit = 24) =>
  j<{ results: SSong[] }>(`/search/songs?query=${encodeURIComponent(q)}&limit=${limit}`).then(
    (d) => d.results ?? [],
  );

export const searchAlbums = (q: string, limit = 20) =>
  j<{ results: SAlbum[] }>(`/search/albums?query=${encodeURIComponent(q)}&limit=${limit}`).then(
    (d) => d.results ?? [],
  );

export const searchArtists = (q: string, limit = 20) =>
  j<{ results: SArtistFull[] }>(
    `/search/artists?query=${encodeURIComponent(q)}&limit=${limit}`,
  ).then((d) => d.results ?? []);

export const searchPlaylists = (q: string, limit = 20) =>
  j<{ results: SPlaylist[] }>(
    `/search/playlists?query=${encodeURIComponent(q)}&limit=${limit}`,
  ).then((d) => d.results ?? []);

export const getAlbum = (id: string) => j<SAlbum>(`/albums?id=${encodeURIComponent(id)}`);
export const getArtist = (id: string) => j<SArtistFull>(`/artists?id=${encodeURIComponent(id)}`);
export const getPlaylist = (id: string) =>
  j<SPlaylist>(`/playlists?id=${encodeURIComponent(id)}&limit=100`);

export type Lyrics = { lyrics: string; snippet?: string; copyright?: string };
export const getLyrics = (id: string) =>
  j<Lyrics>(`/songs/${encodeURIComponent(id)}/lyrics`).catch(() => null);

export const artistNames = (s: SSong) => s.artists?.primary?.map((a) => a.name).join(", ") ?? "";
