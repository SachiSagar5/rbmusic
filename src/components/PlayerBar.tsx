import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player";
import { EQ_BANDS, EQ_PRESETS } from "@/lib/player";
import { decode, fmtTime, getLyrics, pickImg, type Lyrics } from "@/lib/saavn";

export function PlayerBar() {
  const p = usePlayer();
  const c = p.current;
  const img = c ? pickImg(c.image) : null;

  return (
    <>
      {p.showQueue && <QueueDrawer />}
      {p.showLyrics && <LyricsDrawer />}
      {p.showEq && <EqDrawer />}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0714]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
        {/* Progress on very top for mobile */}
        <input
          type="range"
          min={0}
          max={p.duration || 0}
          step={0.1}
          value={p.progress}
          onChange={(e) => p.seek(+e.target.value)}
          aria-label="Seek"
          className="block h-1 w-full touch-none accent-fuchsia-400 sm:hidden"
        />
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:flex sm:gap-4 sm:px-6 sm:py-3">
          {/* Track info */}
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10 sm:h-14 sm:w-14">
              {img && <img src={img} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-white">
                {c ? decode(c.name) : "Nothing playing"}
              </p>
              <p className="line-clamp-1 text-xs text-white/50">
                {c
                  ? c.artists?.primary?.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && ", "}
                        <Link to="/artist/$id" params={{ id: a.id }} className="hover:text-white hover:underline">
                          {a.name}
                        </Link>
                      </span>
                    ))
                  : "Pick a track to start"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="col-span-2 row-start-2 flex w-full flex-col items-center gap-1 sm:col-span-1 sm:row-start-auto sm:w-auto sm:flex-[2]">
            <div className="flex items-center gap-3 sm:gap-4">
              <ToggleIcon
                on={p.shuffle}
                title="Shuffle"
                onClick={p.toggleShuffle}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M4 20l16-16M21 16v5h-5M4 4l5 5m6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ToggleIcon>
              <button onClick={p.prev} disabled={!c} aria-label="Previous"
                className="text-white/70 transition hover:text-white disabled:opacity-30">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M6 6h2v12H6zM20 6v12l-10-6z" fill="currentColor"/></svg>
              </button>
              <button onClick={p.toggle} disabled={!c} aria-label={p.playing ? "Pause" : "Play"}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-black transition active:scale-95 hover:scale-105 disabled:opacity-30">
                {p.playing ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                )}
              </button>
              <button onClick={p.next} disabled={!c} aria-label="Next"
                className="text-white/70 transition hover:text-white disabled:opacity-30">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z" fill="currentColor"/></svg>
              </button>
              <ToggleIcon
                on={p.repeat !== "off"}
                title={`Repeat ${p.repeat}`}
                onClick={p.cycleRepeat}
              >
                {p.repeat === "one" ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 2l4 4-4 4M3 12v-2a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 12v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="9" y="16" fontSize="8" fill="currentColor" stroke="none">1</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 2l4 4-4 4M3 12v-2a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 12v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </ToggleIcon>
            </div>
            {/* Desktop seek */}
            <div className="hidden w-full max-w-xl items-center gap-2 text-[10px] text-white/50 sm:flex">
              <span className="w-9 text-right tabular-nums">{fmtTime(p.progress)}</span>
              <input
                type="range" min={0} max={p.duration || 0} step={0.1} value={p.progress}
                onChange={(e) => p.seek(+e.target.value)}
                aria-label="Seek"
                className="h-1 flex-1 touch-none accent-fuchsia-400"
              />
              <span className="w-9 tabular-nums">{fmtTime(p.duration || (c?.duration ?? 0))}</span>
            </div>
          </div>

          {/* Right: queue, lyrics, volume */}
          <div className="hidden items-center gap-2 md:flex">
            <ToggleIcon on={p.showLyrics} title="Lyrics" onClick={() => p.setShowLyrics(!p.showLyrics)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
              </svg>
            </ToggleIcon>
            <ToggleIcon on={p.showQueue} title="Queue" onClick={() => p.setShowQueue(!p.showQueue)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
              </svg>
            </ToggleIcon>
            <div className="flex w-28 items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/50"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor"/></svg>
              <input type="range" min={0} max={1} step={0.01} value={p.volume} aria-label="Volume"
                onChange={(e) => p.setVolume(+e.target.value)}
                className="h-1 flex-1 touch-none accent-fuchsia-400" />
            </div>
          </div>
          {/* Mobile right: queue/lyrics toggles */}
          <div className="flex items-center gap-1 md:hidden">
            <ToggleIcon on={p.showLyrics} title="Lyrics" onClick={() => p.setShowLyrics(!p.showLyrics)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
              </svg>
            </ToggleIcon>
            <ToggleIcon on={p.showQueue} title="Queue" onClick={() => p.setShowQueue(!p.showQueue)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
              </svg>
            </ToggleIcon>
          </div>
        </div>
      </div>
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
      className={`grid h-8 w-8 place-items-center rounded-full transition ${
        on ? "bg-fuchsia-500/20 text-fuchsia-300" : "text-white/60 hover:bg-white/10 hover:text-white"
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
        <p className="p-4 text-sm text-white/50">Queue is empty.</p>
      ) : (
        <ol className="divide-y divide-white/5">
          {p.queue.map((s, i) => (
            <li
              key={`${s.id}-${i}`}
              className={`flex items-center gap-3 px-3 py-2 ${i === p.index ? "bg-white/10" : "hover:bg-white/5"}`}
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
                className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Remove"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
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
      <div className="p-4">
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
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      <aside className="fixed inset-x-0 bottom-[92px] z-40 mx-auto max-h-[70vh] max-w-2xl overflow-hidden rounded-t-2xl border border-white/10 bg-[#150e26] shadow-2xl sm:bottom-[104px]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}