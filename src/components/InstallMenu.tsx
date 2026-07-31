import { useEffect, useState } from "react";
import { Apple, Download, Loader2, Monitor, MonitorDown, Smartphone, X } from "lucide-react";

type DownloadFile = {
  platform: "Android" | "iOS" | "macOS" | "Windows";
  file?: string;
  size?: string;
  available?: boolean;
};

const DEFAULT_FILES: DownloadFile[] = [
  { platform: "Android", file: "rbmusic.apk" },
  { platform: "iOS", file: "rbmusic.ipa" },
  { platform: "macOS", file: "rbmusic.dmg" },
  { platform: "Windows", file: "rbmusic.exe" },
];

const PLATFORM_META: Record<
  DownloadFile["platform"],
  { icon: typeof Smartphone; chip: string; note: string; ext: string }
> = {
  Android: {
    icon: Smartphone,
    chip: "bg-emerald-500/15 text-emerald-400",
    note: "APK — Android 8+",
    ext: "APK",
  },
  iOS: { icon: Apple, chip: "bg-white/10 text-white", note: "IPA — iPhone · iPad", ext: "IPA" },
  macOS: { icon: Monitor, chip: "bg-sky-500/15 text-sky-400", note: "DMG — macOS 12+", ext: "DMG" },
  Windows: {
    icon: MonitorDown,
    chip: "bg-blue-500/15 text-blue-400",
    note: "EXE — Windows 10/11",
    ext: "EXE",
  },
};

export function InstallMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<DownloadFile[]>(DEFAULT_FILES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}downloads/downloads.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.files) && data.files.length > 0) {
          setFiles(
            DEFAULT_FILES.map((d) => {
              const found = data.files.find((f: DownloadFile) => f.platform === d.platform);
              return { ...d, ...found };
            }),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const base = import.meta.env.BASE_URL;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto w-full max-w-md -translate-y-1/2 rounded-3xl glass-panel p-6 animate-in zoom-in-95 fade-in duration-200">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Install RB Music</h3>
              <p className="text-xs text-white/50">Native apps for every device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close install menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {files.map((f) => {
            const meta = PLATFORM_META[f.platform];
            const Icon = meta.icon;
            const href = `${base}downloads/${f.file ?? ""}`;
            return (
              <div
                key={f.platform}
                className="flex items-center gap-3 rounded-2xl bg-white/[3%] p-3 ring-1 ring-white/5"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.chip}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{f.platform}</p>
                  <p className="text-xs text-white/50">{meta.note}</p>
                </div>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                ) : f.available ? (
                  <a
                    href={href}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/30 transition hover:brightness-110 active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/40">
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
          Built from this website with a cloud build service. Download buttons appear here as soon
          as each file is ready.
        </p>
      </div>
    </>
  );
}
