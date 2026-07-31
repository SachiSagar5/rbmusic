import { searchSongs, type SSong } from "./saavn";

const CACHE_KEY = "rbmusic_daily_sync";
const DAILY_LIMIT = 20;
const QUERIES = ["Trending", "New Songs", "Latest Songs", "Fresh Hits"];

export type DailySync = {
  date: string;
  syncedAt: number;
  songs: SSong[];
};

export function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function getDailySync(): DailySync | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as DailySync;
    return cached.date === todayKey() ? cached : null;
  } catch {
    return null;
  }
}

export function formatSyncTime(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}

async function collectFresh(): Promise<SSong[]> {
  const seen = new Set<string>();
  const songs: SSong[] = [];
  await Promise.all(
    QUERIES.map((q) =>
      searchSongs(q, DAILY_LIMIT)
        .then((res) => {
          for (const s of res) {
            if (seen.has(s.id)) continue;
            seen.add(s.id);
            songs.push(s);
          }
        })
        .catch(() => {}),
    ),
  );
  return songs.slice(0, DAILY_LIMIT);
}

export async function syncDailySongs(): Promise<DailySync> {
  const songs = await collectFresh();
  const sync: DailySync = { date: todayKey(), syncedAt: Date.now(), songs };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(sync));
    } catch {}
  }
  return sync;
}

export async function ensureDailySync(): Promise<DailySync> {
  const cached = getDailySync();
  if (cached) return cached;
  return syncDailySongs();
}
