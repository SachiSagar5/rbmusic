import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/playlists", label: "Playlists" },
  { to: "/library", label: "Library" },
] as const;

export function AppHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => (s.location.search as { q?: string })?.q ?? "" });
  const [q, setQ] = useState(search);

  useEffect(() => setQ(search), [search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    navigate({ to: "/", search: { q: value } });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0714]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-white">RB Music</span>
        </Link>

        <form onSubmit={submit} className="ml-auto flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 sm:ml-4">
          <svg viewBox="0 0 24 24" fill="none" className="ml-1 h-4 w-4 shrink-0 text-white/50">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"
          />
        </form>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile bottom-nav-style tabs under header */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 sm:hidden">
        {NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                active ? "bg-white/10 text-white" : "text-white/60"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}