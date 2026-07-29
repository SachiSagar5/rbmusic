import { useDevice } from "@/lib/device";
import { usePlayer } from "@/lib/player";

export function CastBtn({ songId, onCast }: { songId?: string; onCast?: () => void }) {
  const dev = useDevice();
  const player = usePlayer();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dev.activeDeviceId) return;
    if (onCast) { onCast(); return; }
    if (player.current && !songId) {
      dev.playOnDevice(dev.activeDeviceId, player.current, player.progress);
    }
  };

  return (
    <button
      title={dev.activeDeviceId ? "Push to device" : "No device connected"}
      aria-label="Push to device"
      onClick={handleClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition ${
        dev.activeDeviceId ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-white/20"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
