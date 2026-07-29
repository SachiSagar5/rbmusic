import { usePlayer } from "@/lib/player";
import { pickImg } from "@/lib/saavn";

export function NowPlayingBackdrop() {
  const { current, playing } = usePlayer();
  const img = current ? pickImg(current.image) : null;
  if (!img) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        key={img}
        className={`absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-1000 ${
          playing ? "np-anim" : ""
        }`}
        style={{
          backgroundImage: `url(${img})`,
          filter: "blur(80px) saturate(160%)",
          transform: "scale(1.4)",
        }}
      />
      <div className="absolute inset-0 bg-[#07040f]/55" />
      <style>{`
        @keyframes npFloat {
          0%   { transform: scale(1.4) translate3d(0,0,0); }
          50%  { transform: scale(1.5) translate3d(-2%, 1%, 0); }
          100% { transform: scale(1.4) translate3d(0,0,0); }
        }
        .np-anim { animation: npFloat 18s ease-in-out infinite; }
      `}</style>
    </div>
  );
}