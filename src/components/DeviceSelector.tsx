import { useState } from "react";
import { useDevice } from "@/lib/device";
import { usePlayer } from "@/lib/player";

export function DeviceSelector() {
  const dev = useDevice();
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(dev.deviceName);

  const active = dev.discovered.find((d) => d.id === dev.activeDeviceId);

  const handleSelectDevice = async (deviceId: string | null) => {
    if (deviceId === null) {
      dev.setActiveDevice(null);
      dev.setMode("local");
      setOpen(false);
      return;
    }

    const target = dev.discovered.find((d) => d.id === deviceId);
    if (!target) return;

    dev.setActiveDevice(deviceId);
    dev.setMode("remote");

    if (player.current) {
      await dev.playOnDevice(deviceId, player.current, player.progress);
      if (player.playing) {
        player.toggle();
      }
    }
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Play on device"
        aria-label="Play on device"
        className={`grid h-8 w-8 place-items-center rounded-full transition ${
          dev.mode === "remote" && active
            ? "glass-chip text-fuchsia-200"
            : "text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="fixed inset-x-3 bottom-[110px] z-40 mx-auto max-h-[70vh] max-w-md overflow-hidden rounded-3xl glass-panel sm:bottom-[124px] sm:inset-x-6">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Play on device</h3>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white" aria-label="Close">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* This device */}
              <div className="border-b border-white/10 px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  This device
                </p>

                {editingName ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      dev.setDeviceName(nameInput);
                      setEditingName(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-fuchsia-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setNameInput(dev.deviceName);
                      setEditingName(true);
                    }}
                    className="group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-fuchsia-300" fill="currentColor">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    <span className="text-sm font-medium text-white">{dev.deviceName}</span>
                    <span className="ml-auto text-[10px] text-white/40">Local</span>
                  </button>
                )}
              </div>

              {/* Discovered devices */}
              <div className="px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  Network devices
                </p>
                {dev.discovered.length === 0 ? (
                  <p className="text-sm text-white/50">No devices found on the network.</p>
                ) : (
                  <div className="space-y-1">
                    {dev.discovered.map((d) => {
                      const isActive = d.id === dev.activeDeviceId;
                      return (
                        <button
                          key={d.id}
                          onClick={() => handleSelectDevice(isActive ? null : d.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                            isActive ? "bg-fuchsia-500/15 ring-1 ring-fuchsia-500/30" : "hover:bg-white/5"
                          }`}
                        >
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            isActive ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-white/10 text-white/60"
                          }`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              {d.type === "phone" ? (
                                <rect x="5" y="2" width="14" height="20" rx="2" />
                              ) : d.type === "tablet" ? (
                                <rect x="3" y="2" width="18" height="20" rx="2" />
                              ) : d.type === "speaker" ? (
                                <>
                                  <rect x="2" y="3" width="20" height="14" rx="2" />
                                  <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                                </>
                              ) : (
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                              )}
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className={`line-clamp-1 text-sm font-medium ${isActive ? "text-fuchsia-200" : "text-white"}`}>
                              {d.name}
                            </p>
                            <p className="text-[11px] text-white/50 capitalize">{d.type}</p>
                          </div>
                          {isActive && (
                            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-fuchsia-400" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="border-t border-white/10 px-4 py-2.5">
                <p className="text-[10px] text-white/30">
                  Open this page on another device on the same network to see it here.
                </p>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
