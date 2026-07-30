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
  castAvailable: boolean;
  casting: boolean;
  castError: string | null;
  openCastPicker: () => Promise<void>;
  eqGains: number[];
  boost: number;
  eqError: string | null;
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
  const [castAvailable, setCastAvailable] = useState(false);
  const [casting, setCasting] = useState(false);
  const [castError, setCastError] = useState<string | null>(null);
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [boost, setBoostState] = useState(1);
  const [eqError, setEqError] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const srcNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  // --- Multi-device playback (AirPlay / Chromecast / Remote Playback API) ---
  useEffect(() => {
    const a = audioRef.current as any;
    if (!a) return;
    const cleanups: Array<() => void> = [];

    // Safari / iOS / macOS: AirPlay target availability
    if (typeof (a as any).webkitShowPlaybackTargetPicker === "function") {
      const onAvail = (e: any) => setCastAvailable(e.availability === "available");
      const onChange = (e: any) => setCasting(!!e.target.webkitCurrentPlaybackTargetIsWireless);
      a.addEventListener("webkitplaybacktargetavailabilitychanged", onAvail);
      a.addEventListener("webkitcurrentplaybacktargetiswirelesschanged", onChange);
      cleanups.push(() => {
        a.removeEventListener("webkitplaybacktargetavailabilitychanged", onAvail);
        a.removeEventListener("webkitcurrentplaybacktargetiswirelesschanged", onChange);
      });
    }

    // Chrome / Edge / Android: Remote Playback API (Cast, DLNA, smart TVs)
    const remote = a.remote as any;
    if (remote && typeof remote.watchAvailability === "function") {
      let watchId: number | undefined;
      remote
        .watchAvailability((available: boolean) => setCastAvailable((v) => v || available))
        .then((id: number) => (watchId = id))
        .catch(() => {});
      const onConnect = () => setCasting(true);
      const onDisconnect = () => setCasting(false);
      remote.addEventListener("connect", onConnect);
      remote.addEventListener("connecting", onConnect);
      remote.addEventListener("disconnect", onDisconnect);
      cleanups.push(() => {
        if (watchId !== undefined) remote.cancelWatchAvailability(watchId).catch(() => {});
        remote.removeEventListener("connect", onConnect);
        remote.removeEventListener("connecting", onConnect);
        remote.removeEventListener("disconnect", onDisconnect);
      });
    }
    return () => cleanups.forEach((f) => f());
  }, []);

  const openCastPicker = useCallback(async () => {
    const a = audioRef.current as any;
    if (!a) return;
    setCastError(null);
    try {
      if (typeof a.webkitShowPlaybackTargetPicker === "function") {
        a.webkitShowPlaybackTargetPicker();
        return;
      }
      if (a.remote && typeof a.remote.prompt === "function") {
        await a.remote.prompt();
        return;
      }
      setCastError(
        "This browser can't discover nearby devices. Use Chrome (Cast) or Safari (AirPlay), or cast the whole tab from the browser menu.",
      );
    } catch (e: any) {
      // User closed the picker — not an error worth surfacing.
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return;
      const msg = String(e?.message || "");
      if (e?.name === "NotFoundError" || /no remote playback devices/i.test(msg)) {
        setCastError(
          "No devices found on this network. Make sure your TV, speaker or PC is powered on, connected to the same Wi-Fi, and Cast/AirPlay enabled — then try again. You can also use the browser menu → Cast to mirror this tab.",
        );
      } else {
        setCastError(msg || "Couldn't start casting.");
      }
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

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
      showEq,
      eqEnabled,
      eqGains,
      boost,
      eqError,
      castAvailable,
      casting,
      castError,
      openCastPicker,
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
    [queue, index, current, playing, progress, duration, volume, shuffle, repeat, showQueue, showLyrics, showEq, eqEnabled, eqGains, boost, eqError, castAvailable, casting, castError, openCastPicker, playList, playSong, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, removeFromQueue, jumpTo, enableEq, disableEq, setEqBand, applyEqPreset, setBoost],
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
        {...{ "x-webkit-airplay": "allow" }}
        preload="metadata"
      />
    </PlayerCtx.Provider>
  );
}