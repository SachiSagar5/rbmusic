import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBlob } from "./idb";
import { pickAudio, type SSong } from "./saavn";

export type RepeatMode = "off" | "all" | "one";

type Ctx = {
  queue: SSong[];
  index: number;
  current: SSong | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  showQueue: boolean;
  showLyrics: boolean;
  playList: (list: SSong[], startIdx?: number) => void;
  playSong: (song: SSong) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: SSong) => void;
  removeFromQueue: (idx: number) => void;
  jumpTo: (idx: number) => void;
  setShowQueue: (v: boolean) => void;
  setShowLyrics: (v: boolean) => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function usePlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("usePlayer must be used inside PlayerProvider");
  return c;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<SSong[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const loadAndPlay = useCallback(async (song: SSong) => {
    const a = audioRef.current;
    if (!a) return;
    revokeObjectUrl();
    // Prefer offline blob if present
    const blob = await getBlob(song.id).catch(() => undefined);
    let src = "";
    if (blob) {
      src = URL.createObjectURL(blob);
      objectUrlRef.current = src;
    } else {
      src = pickAudio(song.downloadUrl);
    }
    if (!src) return;
    a.src = src;
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, []);

  // Load whenever current changes (by id)
  const currentId = current?.id;
  useEffect(() => {
    if (!current) return;
    loadAndPlay(current);
    // Media Session for mobile lock-screen controls
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.name,
          artist: current.artists?.primary?.map((a) => a.name).join(", "),
          album: current.album?.name,
          artwork: current.image?.map((i) => ({ src: i.url, sizes: i.quality })),
        });
      } catch {}
    }
    return revokeObjectUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const playList = useCallback((list: SSong[], startIdx = 0) => {
    if (!list.length) return;
    setQueue(list);
    setIndex(Math.max(0, Math.min(startIdx, list.length - 1)));
  }, []);

  const playSong = useCallback((song: SSong) => {
    setQueue((q) => {
      const existing = q.findIndex((s) => s.id === song.id);
      if (existing >= 0) {
        setIndex(existing);
        return q;
      }
      setIndex(0);
      return [song];
    });
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [current]);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        if (queue.length === 0) return -1;
        if (repeat === "one" && dir === 1) return i;
        if (shuffle && dir === 1) {
          if (queue.length === 1) return i;
          let n = i;
          while (n === i) n = Math.floor(Math.random() * queue.length);
          return n;
        }
        const next = i + dir;
        if (next < 0) return 0;
        if (next >= queue.length) return repeat === "all" ? 0 : i;
        return next;
      });
    },
    [queue.length, repeat, shuffle],
  );

  const next = useCallback(() => advance(1), [advance]);
  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    advance(-1);
  }, [advance]);

  const seek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  }, []);

  const setVolume = useCallback((v: number) => setVolumeState(v), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  const addToQueue = useCallback((song: SSong) => {
    setQueue((q) => {
      if (q.some((s) => s.id === song.id)) return q;
      const nq = [...q, song];
      if (index < 0) setIndex(0);
      return nq;
    });
  }, [index]);

  const removeFromQueue = useCallback((idx: number) => {
    setQueue((q) => {
      const nq = q.filter((_, i) => i !== idx);
      setIndex((cur) => {
        if (idx < cur) return cur - 1;
        if (idx === cur) return Math.min(cur, nq.length - 1);
        return cur;
      });
      return nq;
    });
  }, []);

  const jumpTo = useCallback((idx: number) => {
    setIndex(idx);
  }, []);

  // Media Session handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler("play", toggle);
      ms.setActionHandler("pause", toggle);
      ms.setActionHandler("previoustrack", prev);
      ms.setActionHandler("nexttrack", next);
      ms.setActionHandler("seekto", (d) => {
        if (typeof d.seekTime === "number") seek(d.seekTime);
      });
    } catch {}
  }, [toggle, prev, next, seek]);

  const ctx = useMemo<Ctx>(
    () => ({
      queue,
      index,
      current,
      playing,
      progress,
      duration,
      volume,
      shuffle,
      repeat,
      showQueue,
      showLyrics,
      playList,
      playSong,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      removeFromQueue,
      jumpTo,
      setShowQueue,
      setShowLyrics,
    }),
    [queue, index, current, playing, progress, duration, volume, shuffle, repeat, showQueue, showLyrics, playList, playSong, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, removeFromQueue, jumpTo],
  );

  return (
    <PlayerCtx.Provider value={ctx}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (repeat === "one") {
            const a = audioRef.current;
            if (a) {
              a.currentTime = 0;
              a.play().catch(() => {});
            }
          } else {
            advance(1);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="metadata"
      />
    </PlayerCtx.Provider>
  );
}