import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ───────── types ───────── */

export type DeviceInfo = {
  id: string;
  name: string;
  type: "speaker" | "phone" | "tablet" | "computer";
  lastSeen: number;
  status: DeviceStatus;
};

export type DeviceStatus = {
  playing: boolean;
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  progress: number;
  duration: number;
  volume: number;
};

export type DeviceCommand =
  | { type: "play"; songId: string; songName: string; artistName: string; audioUrl: string; imageUrl: string; duration: number; position?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "seek"; position: number }
  | { type: "setVolume"; volume: number }
  | { type: "stop" };

/* ───────── in-memory store (server-side) ───────── */

const DEVICES = new Map<string, DeviceInfo>();
const COMMAND_QUEUES = new Map<string, DeviceCommand[]>();
const DEVICE_STATUSES = new Map<string, DeviceStatus>();

const STALE_MS = 70_000;

function cleanupStale() {
  const now = Date.now();
  for (const [id, dev] of DEVICES) {
    if (now - dev.lastSeen > STALE_MS) {
      DEVICES.delete(id);
      COMMAND_QUEUES.delete(id);
      DEVICE_STATUSES.delete(id);
    }
  }
}

function generateId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ───────── server functions ───────── */

export const registerDevice = createServerFn({ method: "POST" })
  .validator((data: { name: string; type: DeviceInfo["type"] }) => data)
  .handler(async ({ data }) => {
    cleanupStale();
    const id = generateId();
    const device: DeviceInfo = {
      id,
      name: data.name,
      type: data.type,
      lastSeen: Date.now(),
      status: { playing: false, trackId: null, trackName: null, artistName: null, progress: 0, duration: 0, volume: 0.85 },
    };
    DEVICES.set(id, device);
    COMMAND_QUEUES.set(id, []);
    DEVICE_STATUSES.set(id, device.status);
    return device;
  });

export const unregisterDevice = createServerFn({ method: "POST" })
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data }) => {
    DEVICES.delete(data.deviceId);
    COMMAND_QUEUES.delete(data.deviceId);
    DEVICE_STATUSES.delete(data.deviceId);
    return { ok: true };
  });

export const heartbeat = createServerFn({ method: "POST" })
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data }) => {
    const dev = DEVICES.get(data.deviceId);
    if (!dev) return { ok: false };
    dev.lastSeen = Date.now();
    return { ok: true };
  });

export const fetchDevices = createServerFn({ method: "GET" }).handler(async () => {
  cleanupStale();
  return Array.from(DEVICES.values());
});

export const updateDeviceStatus = createServerFn({ method: "POST" })
  .validator((data: { deviceId: string; status: Partial<DeviceStatus> }) => data)
  .handler(async ({ data }) => {
    const existing = DEVICE_STATUSES.get(data.deviceId);
    if (!existing) return { ok: false };
    const updated = { ...existing, ...data.status };
    DEVICE_STATUSES.set(data.deviceId, updated);
    const dev = DEVICES.get(data.deviceId);
    if (dev) {
      dev.status = updated;
      dev.lastSeen = Date.now();
    }
    return { ok: true };
  });

export const sendCommand = createServerFn({ method: "POST" })
  .validator((data: { targetDeviceId: string; command: DeviceCommand }) => data)
  .handler(async ({ data }) => {
    const queue = COMMAND_QUEUES.get(data.targetDeviceId);
    if (!queue) return { ok: false, reason: "Device not found" };
    queue.push(data.command);
    return { ok: true };
  });

export const pollCommands = createServerFn({ method: "POST" })
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data }) => {
    const queue = COMMAND_QUEUES.get(data.deviceId);
    if (!queue) return [];
    const cmds = [...queue];
    COMMAND_QUEUES.set(data.deviceId, []);
    return cmds;
  });
