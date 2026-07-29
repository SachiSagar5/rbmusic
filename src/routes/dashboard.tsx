import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getLikes, getPlaylists, getDownloadMeta, subscribeLibrary } from "@/lib/library";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RB Music" },
      { name: "description", content: "Your RB Music dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [likes, setLikes] = useState(() => getLikes().length);
  const [pls, setPls] = useState(() => getPlaylists().length);
  const [dls, setDls] = useState(() => getDownloadMeta().length);

  useEffect(() => subscribeLibrary(() => {
    setLikes(getLikes().length);
    setPls(getPlaylists().length);
    setDls(getDownloadMeta().length);
  }), []);

  if (auth.loading) return null;
  if (!auth.user) { navigate({ to: "/login" }); return null; }

  const stats = [
    { label: "Liked Songs", value: likes, to: "/library" },
    { label: "Playlists", value: pls, to: "/library" },
    { label: "Downloads", value: dls, to: "/library" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome back, {auth.user.name}</h1>
          <p className="mt-1 text-sm text-white/60">{auth.user.email}</p>
        </div>
        <button
          onClick={() => { auth.signOut(); navigate({ to: "/" }); }}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-2xl p-4 text-center glass transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20"
          >
            <p className="text-3xl font-bold text-white sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-white/50 sm:text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          to="/library"
          className="flex items-center gap-4 rounded-2xl p-4 glass transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-fuchsia-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Your Library</p>
            <p className="text-xs text-white/50">Liked songs, playlists, and downloads</p>
          </div>
        </Link>
        <Link
          to="/playlists"
          className="flex items-center gap-4 rounded-2xl p-4 glass transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-fuchsia-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Browse Playlists</p>
            <p className="text-xs text-white/50">Featured and curated playlists</p>
          </div>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-4 rounded-2xl p-4 glass transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-fuchsia-200" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Home</p>
            <p className="text-xs text-white/50">Discover trending songs and new releases</p>
          </div>
        </Link>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-4 rounded-2xl p-4 text-left glass transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 4v12m0 0-4-4m4 4 4-4" />
              <path d="M4 20h16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Sign Out</p>
            <p className="text-xs text-white/50">Switch to a different account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
