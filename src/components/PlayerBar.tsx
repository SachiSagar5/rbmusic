import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player";
import { EQ_BANDS, EQ_PRESETS } from "@/lib/player";
import { decode, fmtTime, getLyrics, pickImg, type Lyrics } from "@/lib/saavn";
import { DeviceSelector } from "./DeviceSelector";

export function PlayerBar() {
  const p = usePlayer();
  const c = p.current;
  const img = c ? pickImg(c.image) : null;

  return (
    <>
      {p.showQueue && <QueueDrawer />}
      {p.showLyrics && <LyricsDrawer />}
      {p.showEq && <EqDrawer />}
      {c && <div className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="mx-2 mb-2 rounded-[1.25rem] bg-[#0d0a1a]/95 backdrop-blur-2xl ring-1 ring-white/[8%] shadow-2xl shadow-black/60 sm:mx-auto sm:w-1/2">
          <div className="px-3 pt-1 sm:px-5">
            <input
              type="range"
              min={0}
              max={p.duration || 0}
              step={0.1}
              value={p.progress}
              onChange={(e) => p.seek(+e.target.value)}
              aria-label="Seek"
              className="block h-1 w-full touch-none sm:hidden"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
            {/* Track info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15 sm:h-14 sm:w-14">
                {img && <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-white">
                  {c ? decode(c.name) : "Nothing playing"}
                </p>
                <p className="line-clamp-1 text-xs text-white/50">
                  {c
                    ? c.artists?.primary?.map((a, i) => (
                        <span key={a.id}>
                          {i > 0 && ", "}
                          <Link to="/artist/$id" params={{ id: a.id }} className="hover:text-white hover:underline transition-colors">
                            {a.name}
                          </Link>
                        </span>
                      ))
                    : "Pick a track to start"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-0.5 sm:flex-[2]">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={p.prev}
                  disabled={!c}
                  aria-label="Previous"
                  className="text-white/50 transition hover:text-white disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5"><path d="M6 6h2v12H6zM20 6v12l-10-6z" fill="currentColor"/></svg>
                </button>
                <button
                  onClick={p.toggle}
                  disabled={!c}
                  aria-label={p.playing ? "Pause" : "Play"}
                  className={`grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-lg transition-all active:scale-90 hover:scale-105 disabled:opacity-30 sm:h-10 sm:w-10 ${
                    p.playing ? "shadow-fuchsia-300/30" : ""
                  }`}
                >
                  {p.playing ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                  )}
                </button>
                <button
                  onClick={p.next}
                  disabled={!c}
                  aria-label="Next"
                  className="text-white/50 transition hover:text-white disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z" fill="currentColor"/></svg>
                </button>
              </div>
              {/* Desktop seek bar */}
              <div className="hidden w-full max-w-md items-center gap-2 sm:flex">
                <span className="w-8 text-right text-[10px] tabular-nums text-white/40">{fmtTime(p.progress)}</span>
                <input
                  type="range" min={0} max={p.duration || 0} step={0.1} value={p.progress}
                  onChange={(e) => p.seek(+e.target.value)}
                  aria-label="Seek"
                  className="h-1 flex-1 touch-none"
                />
                <span className="w-8 text-[10px] tabular-nums text-white/40">{fmtTime(p.duration || (c?.duration ?? 0))}</span>
              </div>
            </div>

            {/* Right controls */}
            <div className="hidden items-center gap-1.5 md:flex">
              <ToggleIcon on={p.shuffle} title="Shuffle" onClick={p.toggleShuffle}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M4 20l16-16M21 16v5h-5M4 4l5 5m6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ToggleIcon>
              <ToggleIcon on={p.repeat !== "off"} title={`Repeat ${p.repeat}`} onClick={p.cycleRepeat}>
                {p.repeat === "one" ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 2l4 4-4 4M3 12v-2a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 12v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="9" y="16" fontSize="8" fill="currentColor" stroke="none">1</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 2l4 4-4 4M3 12v-2a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 12v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </ToggleIcon>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <DeviceSelector />
              <ToggleIcon on={p.showLyrics} title="Lyrics" onClick={() => p.setShowLyrics(!p.showLyrics)}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
                </svg>
              </ToggleIcon>
              <ToggleIcon on={p.showQueue} title="Queue" onClick={() => p.setShowQueue(!p.showQueue)}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
              </ToggleIcon>
              <ToggleIcon on={p.eqEnabled || p.showEq} title="Equalizer & Boost" onClick={() => p.setShowEq(!p.showEq)}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 20V10M6 6V4M12 20v-6M12 10V4M18 20v-2M18 14V4M3 10h6M9 14h6M15 18h6" strokeLinecap="round" />
                </svg>
              </ToggleIcon>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <div className="flex w-16 items-center gap-1.5 lg:w-20">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-white/40" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg>
                <input type="range" min={0} max={1} step={0.01} value={p.volume} aria-label="Volume"
                  onChange={(e) => p.setVolume(+e.target.value)}
                  className="h-1 flex-1 touch-none min-w-0" />
              </div>
            </div>

            {/* Mobile right controls */}
            <div className="flex items-center gap-1 md:hidden">
              <DeviceSelector />
              <ToggleIcon on={p.showQueue} title="Queue" onClick={() => p.setShowQueue(!p.showQueue)}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
              </ToggleIcon>
              <button
                onClick={() => p.setShowEq(!p.showEq)}
                className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                  p.showEq ? "bg-fuchsia-500/15 text-fuchsia-300" : "text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 20V10M6 6V4M12 20v-6M12 10V4M18 20v-2M18 14V4M3 10h6M9 14h6M15 18h6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>}
    </>
  );
}

function ToggleIcon({
  children,
  on,
  title,
  onClick,
}: {
  children: React.ReactNode;
  on?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`grid h-7 w-7 place-items-center rounded-lg transition ${
        on ? "bg-fuchsia-500/15 text-fuchsia-300" : "text-white/50 hover:bg-white/10 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function QueueDrawer() {
  const p = usePlayer();
  return (
    <Drawer title="Up next" onClose={() => p.setShowQueue(false)}>
      {p.queue.length === 0 ? (
        <p className="p-5 text-sm text-white/50">Queue is empty.</p>
      ) : (
        <ol className="divide-y divide-white/5">
          {p.queue.map((s, i) => (
            <li
              key={`${s.id}-${i}`}
              className={`flex items-center gap-3 px-4 py-2.5 transition ${
                i === p.index ? "bg-fuchsia-500/10" : "hover:bg-white/5"
              }`}
            >
              <button onClick={() => p.jumpTo(i)} className="min-w-0 flex-1 text-left">
                <p className={`line-clamp-1 text-sm font-medium ${i === p.index ? "text-fuchsia-300" : "text-white"}`}>
                  {i + 1}. {decode(s.name)}
                </p>
                <p className="line-clamp-1 text-xs text-white/50">
                  {s.artists?.primary?.map((a) => a.name).join(", ")}
                </p>
              </button>
              <button
                onClick={() => p.removeFromQueue(i)}
                className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Remove"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

function LyricsDrawer() {
  const p = usePlayer();
  const [lyr, setLyr] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const id = p.current?.id;
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLyr(null);
    getLyrics(id).then((d) => {
      setLyr(d);
      setLoading(false);
    });
  }, [id]);
  return (
    <Drawer title="Lyrics" onClose={() => p.setShowLyrics(false)}>
      <div className="p-5">
        {!p.current ? (
          <p className="text-sm text-white/50">Play a song to see lyrics.</p>
        ) : loading ? (
          <p className="text-sm text-white/50">Loading lyrics…</p>
        ) : lyr?.lyrics ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
            {lyr.lyrics.replace(/<br\s*\/?>/gi, "\n")}
          </pre>
        ) : (
          <p className="text-sm text-white/50">No lyrics available for this song.</p>
        )}
        {lyr?.copyright && <p className="mt-4 text-[10px] text-white/30">{lyr.copyright}</p>}
      </div>
    </Drawer>
  );
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-x-3 bottom-[90px] z-40 mx-auto max-h-[65vh] max-w-2xl overflow-hidden rounded-[1.5rem] bg-[#0d0a1a]/95 backdrop-blur-2xl ring-1 ring-white/[8%] shadow-2xl sm:bottom-[100px] sm:inset-x-6">
        <div className="flex items-center justify-between border-b border-white/[6%] px-5 py-3.5">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}

function EqDrawer() {
  const p = usePlayer();
  return (
    <Drawer title="Equalizer & Volume Boost" onClose={() => p.setShowEq(false)}>
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[4%] p-3.5 ring-1 ring-white/[6%]">
          <div>
            <p className="text-sm font-semibold text-white">Enable audio processing</p>
            <p className="text-xs text-white/50">Powers the equalizer and volume boost.</p>
          </div>
          <button
            onClick={() => (p.eqEnabled ? p.disableEq() : p.enableEq())}
            className={`h-7 w-12 rounded-full transition ${p.eqEnabled ? "bg-fuchsia-500" : "bg-white/15"}`}
            aria-label="Toggle equalizer"
          >
            <span
              className={`block h-6 w-6 translate-y-[2px] rounded-full bg-white shadow-sm transition ${
                p.eqEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        {p.eqError && (
          <p className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300 ring-1 ring-red-500/20">
            {p.eqError}. Try a downloaded/offline track — some streams block cross-origin audio processing.
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Volume boost</p>
            <span className="text-xs tabular-nums text-white/70">{Math.round(p.boost * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={p.boost}
            onChange={(e) => p.setBoost(+e.target.value)}
            disabled={!p.eqEnabled}
            className="h-1 w-full touch-none disabled:opacity-40"
            aria-label="Volume boost"
          />
          <div className="mt-1 flex justify-between text-[10px] text-white/40">
            <span>100%</span>
            <span>200%</span>
            <span>400%</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">Presets</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EQ_PRESETS).map((name) => (
              <button
                key={name}
                onClick={() => p.applyEqPreset(name)}
                disabled={!p.eqEnabled}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Equalizer</p>
          <div className="flex items-end justify-between gap-3">
            {EQ_BANDS.map((freq, i) => (
              <div key={freq} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] tabular-nums text-white/60">
                  {p.eqGains[i] > 0 ? "+" : ""}
                  {p.eqGains[i].toFixed(0)}dB
                </span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={p.eqGains[i]}
                  onChange={(e) => p.setEqBand(i, +e.target.value)}
                  disabled={!p.eqEnabled}
                  className="eq-slider h-28 touch-none disabled:opacity-40"
                  style={{ writingMode: "vertical-lr" as any, WebkitAppearance: "slider-vertical" as any }}
                  aria-label={`${freq} Hz`}
                />
                <span className="text-[10px] text-white/50">
                  {freq >= 1000 ? `${freq / 1000}k` : freq}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-white/40">
          Volume boost above 100% may distort quiet mixes. Requires a browser with Web Audio support.
        </p>
      </div>
    </Drawer>
  );
}
