import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/playlists", label: "Playlists" },
  { to: "/library", label: "Library" },
] as const;

export function AppHeader({
  onMenuToggle,
  theme,
  onThemeToggle,
}: {
  onMenuToggle?: () => void;
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => (s.location.search as { q?: string })?.q ?? "" });
  const [q, setQ] = useState(search);

  useEffect(() => setQ(search), [search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    navigate({ to: "/search", search: { q: value } });
  };

  return (
    <header className="sticky top-0 z-20">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        {/* Mobile logo + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onMenuToggle}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition"
            aria-label="Menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                <path
                  d="M9 18V6l10-2v12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">RB Music</span>
          </Link>
        </div>

        {/* Search bar */}
        <form
          onSubmit={submit}
          className="relative ml-auto flex flex-1 items-center max-w-md lg:mx-auto lg:max-w-lg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 h-4 w-4 text-white/40"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you want to listen to?"
            className="h-10 w-full rounded-2xl bg-white/[6%] pl-10 pr-4 text-sm text-white outline-none ring-1 ring-white/[6%] transition placeholder:text-white/30 focus:bg-white/[8%] focus:ring-fuchsia-500/40"
          />
        </form>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onThemeToggle}
            className="theme-toggle hidden sm:flex"
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="theme-toggle-icon theme-toggle-icon--sun">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="theme-toggle-thumb">
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
            <span className="theme-toggle-icon theme-toggle-icon--moon">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </span>
          </button>
          <button
            onClick={onThemeToggle}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/80 sm:hidden"
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/80"
            aria-label="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white ring-1 ring-white/20 transition hover:shadow-lg hover:shadow-fuchsia-500/30 active:scale-95"
            aria-label="Profile"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile nav tabs */}
      <nav className="mx-4 flex items-center gap-1 overflow-x-auto lg:hidden">
        {NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active ? "bg-white/10 text-white" : "text-white/50"
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
