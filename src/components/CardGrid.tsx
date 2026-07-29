import { Link } from "@tanstack/react-router";
import { decode, pickImg, type SImg } from "@/lib/saavn";

type Item = {
  id: string;
  name: string;
  image: SImg[];
  subtitle?: string;
  to: "/album/$id" | "/artist/$id" | "/playlist/$id";
  round?: boolean;
};

export function CardGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((it) => (
        <Link
          key={it.id}
          to={it.to}
          params={{ id: it.id }}
          className="group overflow-hidden rounded-3xl p-3 glass transition hover:-translate-y-1"
        >
          <div className={`aspect-square overflow-hidden bg-white/10 ${it.round ? "rounded-full" : "rounded-xl"}`}>
            {pickImg(it.image) && (
              <img
                src={pickImg(it.image)}
                alt={decode(it.name)}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            )}
          </div>
          <p className="mt-3 line-clamp-1 px-1 text-sm font-semibold text-white">{decode(it.name)}</p>
          {it.subtitle && (
            <p className="mt-0.5 line-clamp-1 px-1 text-xs text-white/50">{it.subtitle}</p>
          )}
        </Link>
      ))}
    </div>
  );
}