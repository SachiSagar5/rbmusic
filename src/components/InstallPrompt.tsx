import { useEffect, useState } from "react";

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const APP_INSTALLED_KEY = "rbmusic_app_installed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isRunningAsApp() {
  if (typeof window === "undefined") return false;
  try {
    return isStandalone() || localStorage.getItem(APP_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [installed, setInstalled] = useState(isRunningAsApp);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as unknown as DeferredPrompt);
      setShowButton(true);
    };
    const onInstalled = () => {
      localStorage.setItem(APP_INSTALLED_KEY, "1");
      setInstalled(true);
      setShowPopup(false);
      setShowButton(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOS() && !isRunningAsApp()) setShowButton(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installNow = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(APP_INSTALLED_KEY, "1");
        setInstalled(true);
      }
      setDeferred(null);
      setShowPopup(false);
    } else if (isIOS()) {
      setShowPopup(true);
    }
  };

  if (installed || !showButton) return null;

  return (
    <>
      {/* Floating install button */}
      <button
        onClick={installNow}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/40 transition hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
        aria-label="Install app"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Install app
      </button>

      {/* Popup */}
      {showPopup && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl glass-panel p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none">
                  <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install RB Music</h3>
                <p className="text-xs text-white/50">Your music, one tap away.</p>
              </div>
            </div>

            {isIOS() ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-white/70">
                  On iPhone/iPad, use your browser&apos;s share button to add the app to your home screen:
                </p>
                <ol className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">1</span>
                    <span>Tap the <b>Share</b> icon in Safari</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">2</span>
                    <span>Choose <b>&quot;Add to Home Screen&quot;</b></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">3</span>
                    <span>Tap <b>Add</b> — RB Music launches like a native app</span>
                  </li>
                </ol>
                <button
                  onClick={() => setShowPopup(false)}
                  className="mt-2 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Got it
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-white/70">
                  Install RB Music to get a native app experience with offline-ready playback, faster loading and quick access from your home screen.
                </p>
                <p className="text-xs text-white/40">Works on Android, Windows and macOS.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Later
                  </button>
                  <button
                    onClick={installNow}
                    className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110"
                  >
                    Install now
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
