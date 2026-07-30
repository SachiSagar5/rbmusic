import { useEffect, useRef, useState, type ReactNode } from "react";

const SKELETON = (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-44 w-44 shrink-0 animate-pulse rounded-2xl bg-white/[4%]" />
    ))}
  </div>
);

export function LazySection({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [visible, setVisible] = useState(!enabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, visible]);

  return <div ref={ref}>{visible ? children : SKELETON}</div>;
}
