import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PlayerProvider } from "@/lib/player";
import { DeviceProvider } from "@/lib/device";
import { AppHeader } from "@/components/AppHeader";
import { PlayerBar } from "@/components/PlayerBar";
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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RB Music — Stream Music You Love" },
      { name: "description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:title", content: "RB Music — Stream Music You Love" },
      { property: "og:description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RB Music — Stream Music You Love" },
      { name: "twitter:description", content: "Search and stream millions of songs, albums, artists and playlists instantly with RB Music." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/101abaab-570b-450e-aa00-5927854f0c9d" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/101abaab-570b-450e-aa00-5927854f0c9d" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <PlayerProvider>
          <AuthProvider>
            <div className="relative min-h-screen overflow-hidden bg-[#07040f] text-white">
            <NowPlayingBackdrop />
            {/* Liquid glass ambient background */}
            <div className="pointer-events-none fixed -top-40 -left-32 h-[620px] w-[620px] rounded-full bg-fuchsia-500/40 blur-[120px]" />
            <div className="pointer-events-none fixed top-40 right-0 h-[520px] w-[520px] rounded-full bg-indigo-500/35 blur-[110px]" />
            <div className="pointer-events-none fixed bottom-0 left-1/3 h-[480px] w-[480px] rounded-full bg-cyan-400/20 blur-[120px]" />
            <div className="pointer-events-none fixed -bottom-20 right-1/4 h-[420px] w-[420px] rounded-full bg-pink-500/25 blur-[100px]" />
            <div className="relative z-10">
              <AppHeader />
              <main className="mx-3 max-w-7xl px-4 pb-48 pt-6 sm:mx-auto sm:px-6 sm:pb-40">
                <Outlet />
              </main>
            </div>
            <PlayerBar />
          </div>
          <p className="fixed inset-x-0 bottom-0 z-20 pb-6 text-center text-[10px] leading-none text-white/30 sm:pb-7">
            Developed by{" "}
            <a href="https://t.me/zukosgr" target="_blank" rel="noopener noreferrer" className="text-fuchsia-300/60 hover:text-fuchsia-300 transition-colors">
              @zukosgr
            </a>
          </p>
          </AuthProvider>
        </PlayerProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
}
