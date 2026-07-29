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
import { useDevice } from "./device";

export type RepeatMode = "off" | "all" | "one";

export const EQ_BANDS = [60, 250, 1000, 4000, 12000] as const;
export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  "Bass Boost": [8, 5, 0, 0, 0],
  Vocal: [-2, 0, 3, 4, 1],
  Treble: [0, 0, 0, 4, 7],
  "Loudness+": [6, 2, 0, 2, 5],
};

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
  showEq: boolean;
  eqEnabled: boolean;
  eqGains: number[];
  boost: number;
  eqError: string | null;
  remotePlaying: boolean;
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
  setShowEq: (v: boolean) => void;
  enableEq: () => Promise<void>;
  disableEq: () => void;
  setEqBand: (i: number, gain: number) => void;
  applyEqPreset: (name: string) => void;
  setBoost: (v: number) => void;
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
  const [showEq, setShowEq] = useState(false);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [boost, setBoostState] = useState(1);
  const [eqError, setEqError] = useState<string | null>(null);
  const [remotePlaying, setRemotePlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const srcNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const current = index >= 0 && index < queue.length ? queue[index] : null;
  const dev = useDevice();

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const isRemote = dev.mode === "remote" && !!dev.activeDeviceId;

  const enableEq = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    setEqError(null);
    try {
      if (!audioCtxRef.current) {
        const AC: typeof AudioContext =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) throw new Error("Web Audio not supported");
        // Ensure CORS so MediaElementSource isn't silenced for remote streams.
        if (a.crossOrigin !== "anonymous") {
          const t = a.currentTime;
          const s = a.src;
          a.crossOrigin = "anonymous";
          if (s) {
            a.src = s;
            try {
              await a.play();
              a.currentTime = t;
            } catch {}
          }
        }
        const ctx = new AC();
        const src = ctx.createMediaElementSource(a);
        const filters = EQ_BANDS.map((freq, i) => {
          const f = ctx.createBiquadFilter();
          f.type = i === 0 ? "lowshelf" : i === EQ_BANDS.length - 1 ? "highshelf" : "peaking";
          f.frequency.value = freq;
          f.Q.value = 1;
          f.gain.value = eqGains[i] ?? 0;
          return f;
        });
        const gain = ctx.createGain();
        gain.gain.value = boost;
        // chain: src -> f0 -> f1 -> ... -> gain -> destination
        let node: AudioNode = src;
        for (const f of filters) {
          node.connect(f);
          node = f;
        }
        node.connect(gain);
        gain.connect(ctx.destination);
        audioCtxRef.current = ctx;
        srcNodeRef.current = src;
        filtersRef.current = filters;
        gainNodeRef.current = gain;
      }
      await audioCtxRef.current.resume();
      setEqEnabled(true);
    } catch (e: any) {
      setEqError(e?.message || "Failed to enable equalizer");
      setEqEnabled(false);
    }
  }, [boost, eqGains]);

  const disableEq = useCallback(() => {
    // Flatten filters and reset gain so playback is unaffected while disabled.
    filtersRef.current.forEach((f) => (f.gain.value = 0));
    if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
    setEqEnabled(false);
  }, []);

  const setEqBand = useCallback((i: number, gain: number) => {
    setEqGains((g) => {
      const n = [...g];
      n[i] = gain;
      return n;
    });
    const f = filtersRef.current[i];
    if (f && eqEnabled) f.gain.value = gain;
  }, [eqEnabled]);

  const applyEqPreset = useCallback((name: string) => {
    const preset = EQ_PRESETS[name];
    if (!preset) return;
    setEqGains(preset);
    if (eqEnabled) {
      filtersRef.current.forEach((f, i) => (f.gain.value = preset[i] ?? 0));
    }
  }, [eqEnabled]);

  const setBoost = useCallback((v: number) => {
    const clamped = Math.max(1, Math.min(4, v));
    setBoostState(clamped);
    if (gainNodeRef.current && eqEnabled) gainNodeRef.current.gain.value = clamped;
  }, [eqEnabled]);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const loadAndPlay = useCallback(async (song: SSong) => {
    if (isRemote && dev.activeDeviceId) {
      await dev.playOnDevice(dev.activeDeviceId, song, 0);
      setPlaying(false);
      setRemotePlaying(true);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    revokeObjectUrl();
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
  }, [isRemote, dev]);

  // Load whenever current changes (by id)
  const currentId = current?.id;
  useEffect(() => {
    if (!current) return;
    loadAndPlay(current);
    if (!isRemote && "mediaSession" in navigator) {
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
  }, [currentId, isRemote]);

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
    if (isRemote && dev.activeDeviceId) {
      if (remotePlaying) {
        dev.pauseDevice(dev.activeDeviceId);
        setRemotePlaying(false);
      } else {
        dev.resumeDevice(dev.activeDeviceId);
        setRemotePlaying(true);
      }
      return;
    }
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [current, isRemote, dev, remotePlaying]);

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
    if (isRemote && dev.activeDeviceId) {
      dev.seekDevice(dev.activeDeviceId, t);
      setProgress(t);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  }, [isRemote, dev]);

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
      showEq,
      eqEnabled,
      eqGains,
      boost,
      eqError,
      remotePlaying,
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
      setShowEq,
      enableEq,
      disableEq,
      setEqBand,
      applyEqPreset,
      setBoost,
    }),
    [queue, index, current, playing, progress, duration, volume, shuffle, repeat, showQueue, showLyrics, showEq, eqEnabled, eqGains, boost, eqError, remotePlaying, playList, playSong, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, removeFromQueue, jumpTo, enableEq, disableEq, setEqBand, applyEqPreset, setBoost],
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