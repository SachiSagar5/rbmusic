import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — RB Music" },
      { name: "description", content: "Sign in to RB Music to access your library, playlists and downloads." },
      { property: "og:title", content: "Sign In — RB Music" },
      { property: "og:description", content: "Sign in to access your library and playlists on RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sign In — RB Music" },
      { name: "twitter:description", content: "Sign in to access your library and playlists on RB Music." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (auth.user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = auth.signIn(email, password);
    if (err) setError(err);
    else navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-white/60">Sign in to access your library and playlists</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl p-6 glass-panel">
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
