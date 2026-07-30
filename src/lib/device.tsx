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
import {
  registerDevice,
  unregisterDevice,
  heartbeat,
  fetchDevices,
  sendCommand,
  pollCommands,
  updateDeviceStatus,
  type DeviceInfo,
  type DeviceCommand,
  type DeviceStatus,
} from "./device-sync";
import { pickAudio, pickImg, type SSong } from "./saavn";

export type DeviceMode = "local" | "remote";

type Ctx = {
  deviceId: string | null;
  deviceName: string;
  discovered: DeviceInfo[];
  activeDeviceId: string | null;
  mode: DeviceMode;
  serverOnline: boolean;
  setDeviceName: (n: string) => void;
  setActiveDevice: (id: string | null) => void;
  setMode: (m: DeviceMode) => void;
  playOnDevice: (deviceId: string, song: SSong, position?: number) => Promise<void>;
  pauseDevice: (deviceId: string) => Promise<void>;
  resumeDevice: (deviceId: string) => Promise<void>;
  seekDevice: (deviceId: string, position: number) => Promise<void>;
  stopDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
};

const DeviceCtx = createContext<Ctx | null>(null);

export function useDevice() {
  const c = useContext(DeviceCtx);
  if (!c) throw new Error("useDevice must be used inside DeviceProvider");
  return c;
}

const STORAGE_KEY = "rbmusic_device_name";
const DEVICE_ID_KEY = "rbmusic_device_id";

function loadDeviceName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || `${navigator.platform} Speaker`;
  } catch {
    return "Speaker";
  }
}

function loadDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

function saveDeviceId(id: string) {
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {}
}

function saveDeviceName(name: string) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {}
}

const POLL_INTERVAL = 2000;
const HEARTBEAT_INTERVAL = 25000;

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(loadDeviceId);
  const [deviceName, setDeviceNameState] = useState(loadDeviceName);
  const [discovered, setDiscovered] = useState<DeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [mode, setMode] = useState<DeviceMode>("local");
  const [serverOnline, setServerOnline] = useState(false);
  const deviceTypeRef = useRef<DeviceInfo["type"]>("speaker");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Detect device type
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) deviceTypeRef.current = "tablet";
    else if (/phone|iphone|android.*mobile/i.test(ua)) deviceTypeRef.current = "phone";
    else if (/tv|smart-tv/i.test(ua)) deviceTypeRef.current = "speaker";
    else deviceTypeRef.current = "computer";
  }, []);

  // Register on mount
  useEffect(() => {
    let cancelled = false;
    let currentId: string | null = null;

    (async () => {
      const name = deviceName || "Speaker";
      try {
        const dev = await registerDevice({ data: { name, type: deviceTypeRef.current } });
        if (cancelled) return;
        currentId = dev.id;
        setDeviceId(dev.id);
        saveDeviceId(dev.id);
        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    })();

    return () => {
      cancelled = true;
      if (currentId) {
        unregisterDevice({ data: { deviceId: currentId } }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat
  useEffect(() => {
    if (!deviceId) return;
    const id = setInterval(async () => {
      try {
        await heartbeat({ data: { deviceId } });
      } catch {}
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, [deviceId]);

  // Poll commands when we are the active remote device
  useEffect(() => {
    if (!deviceId || mode !== "remote") return;
    const id = setInterval(async () => {
      try {
        const cmds = await pollCommands({ data: { deviceId } });
        for (const cmd of cmds) {
          executeRemoteCommand(cmd);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, mode]);

  // Periodically fetch discovered devices
  const refreshDevices = useCallback(async () => {
    try {
      const all = await fetchDevices();
      setDiscovered(all.filter((d) => d.id !== deviceId));
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  }, [deviceId]);

  useEffect(() => {
    refreshDevices();
    const id = setInterval(refreshDevices, 5000);
    return () => clearInterval(id);
  }, [refreshDevices]);

  const setDeviceName = useCallback((n: string) => {
    setDeviceNameState(n);
    saveDeviceName(n);
  }, []);

  const setActiveDevice = useCallback((id: string | null) => {
    setActiveDeviceId(id);
    if (id) setMode("remote");
  }, []);

  // Create hidden audio element for remote playback
  useEffect(() => {
    if (!audioRef.current) {
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.style.display = "none";
      document.body.appendChild(a);
      audioRef.current = a;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
      }
    };
  }, []);

  const playOnDevice = useCallback(async (targetDeviceId: string, song: SSong, position?: number) => {
    const audioUrl = pickAudio(song.downloadUrl);
    const imageUrl = pickImg(song.image);
    if (!audioUrl) return;
    const cmd: DeviceCommand = {
      type: "play",
      songId: song.id,
      songName: song.name,
      artistName: song.artists?.primary?.map((a) => a.name).join(", ") || "",
      audioUrl,
      imageUrl,
      duration: song.duration || 0,
      position,
    };
    await sendCommand({ data: { targetDeviceId, command: cmd } });
  }, []);

  const pauseDevice = useCallback(async (targetDeviceId: string) => {
    await sendCommand({ data: { targetDeviceId, command: { type: "pause" } } });
  }, []);

  const resumeDevice = useCallback(async (targetDeviceId: string) => {
    await sendCommand({ data: { targetDeviceId, command: { type: "resume" } } });
  }, []);

  const seekDevice = useCallback(async (targetDeviceId: string, position: number) => {
    await sendCommand({ data: { targetDeviceId, command: { type: "seek", position } } });
  }, []);

  const stopDevice = useCallback(async (targetDeviceId: string) => {
    await sendCommand({ data: { targetDeviceId, command: { type: "stop" } } });
  }, []);

  // Execute remote commands on this device
  const executeRemoteCommand = useCallback(async (cmd: DeviceCommand) => {
    const a = audioRef.current;
    if (!a) return;
    switch (cmd.type) {
      case "play": {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        a.src = cmd.audioUrl;
        try {
          await a.play();
        } catch {}
        if (cmd.position) a.currentTime = cmd.position;
        break;
      }
      case "pause":
        a.pause();
        break;
      case "resume":
        try { await a.play(); } catch {}
        break;
      case "seek":
        a.currentTime = cmd.position;
        break;
      case "stop":
        a.pause();
        a.currentTime = 0;
        a.src = "";
        break;
      case "setVolume":
        a.volume = Math.max(0, Math.min(1, cmd.volume));
        break;
    }
  }, []);

  // Report status for this device when in remote mode
  useEffect(() => {
    if (!deviceId || mode !== "remote") return;
    const a = audioRef.current;
    if (!a) return;
    const id = setInterval(() => {
      const status: Partial<DeviceStatus> = {
        playing: !a.paused,
        progress: a.currentTime,
      };
      updateDeviceStatus({ data: { deviceId, status } }).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [deviceId, mode]);

  const ctx = useMemo<Ctx>(
    () => ({
      deviceId,
      deviceName,
      discovered,
      activeDeviceId,
      mode,
      serverOnline,
      setDeviceName,
      setActiveDevice,
      setMode,
      playOnDevice,
      pauseDevice,
      resumeDevice,
      seekDevice,
      stopDevice,
      refreshDevices,
    }),
    [deviceId, deviceName, discovered, activeDeviceId, mode, serverOnline, setDeviceName, setActiveDevice, setMode, playOnDevice, pauseDevice, resumeDevice, seekDevice, stopDevice, refreshDevices],
  );

  return <DeviceCtx.Provider value={ctx}>{children}</DeviceCtx.Provider>;
}
