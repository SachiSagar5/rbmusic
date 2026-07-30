import { useCallback, useRef } from "react";
import { usePlayer } from "@/lib/player";
import { decode, fmtTime, pickImg } from "@/lib/saavn";
import { Link } from "@tanstack/react-router";

const BAR_COUNT = 32;

export function NowPlayingView({ onClose }: { onClose: () => void }) {
  const p = usePlayer();
  const c = p.current;
  const img = c ? pickImg(c.image) : null;
  const barRef = useRef<HTMLDivElement>(null);
  const seekingRef = useRef(false);

  const seekFromEvent = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      p.seek(frac * (p.duration || 0));
    },
    [p],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      seekingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      seekFromEvent(e.clientX);
    },
    [seekFromEvent],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!seekingRef.current) return;
      seekFromEvent(e.clientX);
    },
    [seekFromEvent],
  );

  const onPointerUp = useCallback(() => {
    seekingRef.current = false;
  }, []);

  const pct = p.duration > 0 ? (p.progress / p.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07040f] animate-in fade-in duration-300">
      {/* Blurred backdrop */}
      {img && (
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) saturate(140%)",
            transform: "scale(1.3)",
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-12">
        {/* Poster + equalizer */}
        <div className="relative mb-8 w-full max-w-xs aspect-square">
          <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/15 shadow-2xl shadow-black/60">
            {img ? (
              <img
                key={c?.id}
                src={img}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-16 w-16 text-white/20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
            )}
          </div>

          {/* Equalizer bars overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-[3px] px-4 pb-4 pointer-events-none">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`w-[3px] rounded-full bg-gradient-to-t from-fuchsia-500 to-violet-400 ${
                  p.playing ? "eq-bar" : "opacity-30"
                }`}
                style={{
                  height: "6px",
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${0.4 + Math.random() * 0.6}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Song info */}
        <div className="mb-8 w-full max-w-xs text-center">
          <h2 className="line-clamp-1 text-xl font-bold text-white">
            {c ? decode(c.name) : "Nothing playing"}
          </h2>
          <p className="mt-1 line-clamp-1 text-sm text-white/50">
            {c
              ? c.artists?.primary?.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ", "}
                    <Link
                      to="/artist/$id"
                      params={{ id: a.id }}
                      onClick={onClose}
                      className="transition-colors hover:text-white hover:underline"
                    >
                      {a.name}
                    </Link>
                  </span>
                ))
              : "Pick a track to start"}
          </p>
        </div>

        {/* Seek bar */}
        <div className="mb-6 w-full max-w-xs">
          <div
            ref={barRef}
            className="relative h-2 w-full cursor-pointer touch-none rounded-full bg-white/10"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-400 transition-[width] duration-75 ease-linear"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-md shadow-fuchsia-500/40"
              style={{ left: `calc(${pct}% - 10px)` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs tabular-nums text-white/40">
            <span>{fmtTime(p.progress)}</span>
            <span>{fmtTime(p.duration || (c?.duration ?? 0))}</span>
          </div>
        </div>

        {/* Big controls */}
        <div className="flex w-full max-w-xs items-center justify-center gap-8">
          <button
            onClick={p.prev}
            disabled={!c}
            aria-label="Previous"
            className="grid h-14 w-14 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M6 6h2v12H6zM20 6v12l-10-6z"/></svg>
          </button>

          <button
            onClick={p.toggle}
            disabled={!c}
            aria-label={p.playing ? "Pause" : "Play"}
            className="grid h-20 w-20 place-items-center rounded-full bg-white text-black shadow-2xl transition active:scale-90 hover:scale-105 disabled:opacity-30 shadow-fuchsia-300/20"
          >
            {p.playing ? (
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button
            onClick={p.next}
            disabled={!c}
            aria-label="Next"
            className="grid h-14 w-14 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z"/></svg>
          </button>
        </div>
      </div>

      {/* Equalizer bar keyframes — injected once */}
      <style>{`
        @keyframes eqBeat {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1.6); opacity: 1; }
        }
        .eq-bar {
          animation: eqBeat var(--dur, 0.6s) ease-in-out infinite alternate;
          transform-origin: bottom;
        }
        .eq-bar:nth-child(odd) { --dur: 0.5s; }
        .eq-bar:nth-child(3n) { --dur: 0.7s; }
        .eq-bar:nth-child(5n+2) { --dur: 0.4s; }
      `}</style>
    </div>
  );
}
