import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PlayerProvider } from "@/lib/player";
import { DeviceProvider } from "@/lib/device";
import { AppHeader } from "@/components/AppHeader";
import { PlayerBar } from "@/components/PlayerBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { InstallMenu } from "@/components/InstallMenu";
import { NowPlayingBackdrop } from "@/components/NowPlayingBackdrop";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 active:scale-95"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 active:scale-95"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { name: "theme-color", content: "#06030e" },
      { title: "RB Music — Stream Music You Love" },
      { name: "description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:title", content: "RB Music — Stream Music You Love" },
      { property: "og:description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sachisagar5.github.io/rbmusic/" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:site_name", content: "RB Music" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RB Music — Stream Music You Love" },
      { name: "twitter:description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/101abaab-570b-450e-aa00-5927854f0c9d" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/101abaab-570b-450e-aa00-5927854f0c9d" },
      { name: "google-site-verification", content: "" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "canonical", href: "https://sachisagar5.github.io/rbmusic/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("rbm:theme");if(t==="light"){document.documentElement.setAttribute("data-theme","light")}else if(!t&&window.matchMedia("(prefers-color-scheme:light)").matches){document.documentElement.setAttribute("data-theme","light")}}catch(e){}})()`
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "RB Music",
            url: "https://sachisagar5.github.io/rbmusic/",
            description: "Search and stream millions of songs, albums, artists and playlists instantly.",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://sachisagar5.github.io/rbmusic/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }} />
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const SIDEBAR_NAV = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/library", label: "Library", icon: "library" },
  { to: "/playlists", label: "Playlists", icon: "music" },
] as const;

function Sidebar({ mobileOpen, onClose, sidebarOpen, onToggle, onInstallOpen }: { mobileOpen?: boolean; onClose?: () => void; sidebarOpen?: boolean; onToggle?: () => void; onInstallOpen?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const icons: Record<string, ReactNode> = {
    home: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    search: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round"/><path d="m20 20-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    library: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 4v16M16 4v16M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    music: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="16" r="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };

  const expanded = sidebarOpen;

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-gradient-to-r from-fuchsia-500/15 to-purple-500/10 text-white shadow-sm shadow-fuchsia-500/10"
        : "text-white/50 hover:bg-white/5 hover:text-white/80"
    }`;

  const desktopInner = (
    <>
      {/* Toggle button */}
      <div className="flex items-center justify-center px-3 pt-4 pb-3">
        {expanded ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                  <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-white">RB Music</span>
                <span className="block text-[9px] font-medium tracking-wide text-fuchsia-400/70 uppercase">Stream Unlimited</span>
              </div>
            </div>
            <button onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition" aria-label="Collapse sidebar">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={onToggle} className="grid h-9 w-9 place-items-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white transition" aria-label="Expand sidebar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-2">
        {SIDEBAR_NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                expanded ? "gap-3 px-3 justify-start" : "justify-center gap-0 px-0"
              } ${active ? "bg-gradient-to-r from-fuchsia-500/15 to-purple-500/10 text-white shadow-sm shadow-fuchsia-500/10" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
              title={expanded ? undefined : n.label}
            >
              <span className={`${active ? "text-fuchsia-400" : "text-white/40"}`}>{icons[n.icon]}</span>
              {expanded && <span className="ml-0">{n.label}</span>}
              {expanded && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-fuchsia-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[3%] px-2 py-3">
        <button
          onClick={onInstallOpen}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/80 ${
            expanded ? "gap-3 px-3 justify-start" : "justify-center gap-0 px-0"
          }`}
          title={expanded ? undefined : "Install Now"}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded && <span>Install Now</span>}
        </button>
        <Link
          to="/dashboard"
          className={`flex items-center rounded-xl py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/80 ${
            expanded ? "gap-3 px-3 justify-start" : "justify-center gap-0 px-0"
          }`}
          title={expanded ? undefined : "Account"}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded && <span>Account</span>}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar: collapsed vs expanded */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-white/[3%] bg-[#06030e] transition-all duration-300 lg:flex ${
          expanded ? "w-60" : "w-16"
        }`}
      >
        {desktopInner}
      </aside>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-60 animate-in slide-in-from-left-4 flex-col border-r border-white/[3%] bg-[#06030e] lg:hidden">
            <div className="flex justify-end px-4 pt-4 pb-0">
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition" aria-label="Close menu">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2.5 px-6 pt-2 pb-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                  <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-white">RB Music</span>
                <span className="block text-[10px] font-medium tracking-wide text-fuchsia-400/70 uppercase">Stream Unlimited</span>
              </div>
            </div>
            <nav className="flex-1 px-3 py-2">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Menu</p>
              {SIDEBAR_NAV.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-fuchsia-500/15 to-purple-500/10 text-white shadow-sm shadow-fuchsia-500/10"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    <span className={`${active ? "text-fuchsia-400" : "text-white/40"}`}>{icons[n.icon]}</span>
                    {n.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-fuchsia-400" />}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-white/[3%] px-3 py-3">
              <button
                onClick={() => {
                  onClose?.();
                  onInstallOpen?.();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/80"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Install Now
              </button>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/80"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Account
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [installOpen, setInstallOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }
    return "dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("rbm:theme", theme); } catch {}
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <PlayerProvider>
          <AuthProvider>
            <div className="relative min-h-screen overflow-hidden bg-[#06030e] text-white">
              <NowPlayingBackdrop />
              <div className="pointer-events-none fixed -top-40 -left-32 h-[620px] w-[620px] rounded-full bg-fuchsia-500/30 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
              <div className="pointer-events-none fixed top-60 right-0 h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-[110px] animate-pulse" style={{ animationDuration: "10s" }} />
              <div className="pointer-events-none fixed bottom-0 left-1/4 h-[480px] w-[480px] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
              <div className="pointer-events-none fixed -bottom-20 right-1/4 h-[420px] w-[420px] rounded-full bg-pink-500/20 blur-[100px] animate-pulse" style={{ animationDuration: "9s" }} />

              <div className="relative z-10 flex">
                <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} onInstallOpen={() => setInstallOpen(true)} />

                <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-60" : "lg:ml-16"}`}>
                  <AppHeader onMenuToggle={() => setMobileOpen(!mobileOpen)} theme={theme} onThemeToggle={toggleTheme} />

                  <main className="flex-1 px-4 pb-48 pt-4 sm:px-6 sm:pb-40 lg:px-8 xl:px-10">
                    <Outlet />
                  </main>
                </div>
              </div>

              <PlayerBar />
              <InstallPrompt />
              <InstallMenu open={installOpen} onClose={() => setInstallOpen(false)} />
            </div>
            <p className="fixed inset-x-0 bottom-0 z-20 pb-4 text-center text-[10px] leading-none text-white/25">
              Developed by{" "}
              <a href="https://t.me/zukosgr" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400/50 hover:text-fuchsia-400 transition-colors">
                @zukosgr
              </a>
            </p>
          </AuthProvider>
        </PlayerProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
}
