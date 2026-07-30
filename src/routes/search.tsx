import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { SongList } from "@/components/SongList";
import { searchSongs, searchAlbums, searchArtists, searchPlaylists, decode, pickImg, type SSong, type SAlbum, type SArtistFull, type SPlaylist } from "@/lib/saavn";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — RB Music" },
      { name: "description", content: "Search songs, albums, artists and playlists on RB Music." },
      { property: "og:title", content: "Search — RB Music" },
      { property: "og:description", content: "Search songs, albums, artists and playlists on RB Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Search — RB Music" },
      { name: "twitter:description", content: "Search songs, albums, artists and playlists on RB Music." },
    ],
  }),
  component: SearchPage,
});

const LANGUAGES = [
  { name: "Hindi", query: "Hindi" },
  { name: "Punjabi", query: "Punjabi" },
  { name: "English", query: "English" },
  { name: "Tamil", query: "Tamil" },
  { name: "Telugu", query: "Telugu" },
  { name: "Malayalam", query: "Malayalam" },
  { name: "Kannada", query: "Kannada" },
  { name: "Bengali", query: "Bengali" },
  { name: "Bhojpuri", query: "Bhojpuri" },
  { name: "Haryanvi", query: "Haryanvi" },
  { name: "Marathi", query: "Marathi" },
  { name: "Gujarati", query: "Gujarati" },
  { name: "Urdu", query: "Urdu" },
  { name: "Rajasthani", query: "Rajasthani" },
];

function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<{
    songs: SSong[]; albums: SAlbum[]; artists: SArtistFull[]; playlists: SPlaylist[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [langData, setLangData] = useState<Record<string, SPlaylist[]>>({});
  const [langLoading, setLangLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLangLoading(true);
    Promise.all(
      LANGUAGES.map((l) =>
        searchPlaylists(l.query, 8).catch(() => [] as SPlaylist[])
      )
    ).then((results) => {
      if (ignore) return;
      const data: Record<string, SPlaylist[]> = {};
      LANGUAGES.forEach((l, i) => { data[l.name] = results[i]; });
      setLangData(data);
      setLangLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setSearched(true);
    setLoading(true);
    Promise.all([
      searchSongs(v, 20).catch(() => [] as SSong[]),
      searchAlbums(v, 12).catch(() => [] as SAlbum[]),
      searchArtists(v, 12).catch(() => [] as SArtistFull[]),
      searchPlaylists(v, 12).catch(() => [] as SPlaylist[]),
    ]).then(([songs, albums, artists, playlists]) => {
      setSearchResults({ songs, albums, artists, playlists });
      setLoading(false);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Search</h1>
        <p className="mt-1 text-sm text-white/60">Find songs, albums, artists and playlists.</p>
      </div>

      <form onSubmit={submit} className="relative max-w-xl">
        <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for music..."
          className="h-12 w-full rounded-2xl bg-white/[6%] pl-12 pr-4 text-sm text-white outline-none ring-1 ring-white/[6%] transition placeholder:text-white/30 focus:bg-white/[8%] focus:ring-fuchsia-500/40"
        />
      </form>

      {searched ? (
        <SearchResults data={searchResults} loading={loading} query={q} />
      ) : (
        <LanguageGrid languages={LANGUAGES} data={langData} loading={langLoading} />
      )}
    </div>
  );
}

function LanguageGrid({ languages, data, loading }: { languages: typeof LANGUAGES; data: Record<string, SPlaylist[]>; loading: boolean }) {
  return (
    <div className="space-y-10">
      {languages.map((lang) => {
        const items = data[lang.name];
        if (loading || !items?.length) return null;
        return (
          <section key={lang.name}>
            <h2 className="mb-4 text-lg font-bold text-white">{lang.name}</h2>
            <CardGrid
              items={items.map((p) => ({
                id: p.id,
                name: p.name,
                image: p.image,
                subtitle: p.songCount ? `${p.songCount} songs` : undefined,
                to: "/playlist/$id" as const,
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}

function SearchResults({ data, loading, query }: { data: { songs: SSong[]; albums: SAlbum[]; artists: SArtistFull[]; playlists: SPlaylist[] } | null; loading: boolean; query: string }) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-white/5" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || (!data.songs.length && !data.albums.length && !data.artists.length && !data.playlists.length)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[1.75rem] bg-white/[3%] p-12 text-center ring-1 ring-white/[6%]">
        <svg viewBox="0 0 24 24" className="mb-4 h-12 w-12 text-white/20" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="m20 20-3-3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm font-medium text-white/50">No results found for &ldquo;{query}&rdquo;</p>
        <p className="mt-1 text-xs text-white/30">Try searching for a different artist, album or song.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {!!data.songs.length && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">Songs</h2>
          <SongList songs={data.songs.slice(0, 10)} />
        </section>
      )}
      {!!data.albums.length && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">Albums</h2>
          <CardGrid
            items={data.albums.map((a) => ({
              id: a.id, name: a.name, image: a.image,
              subtitle: a.artists?.primary?.map((x) => x.name).join(", ") ?? a.year,
              to: "/album/$id" as const,
            }))}
          />
        </section>
      )}
      {!!data.artists.length && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">Artists</h2>
          <CardGrid
            items={data.artists.map((a) => ({
              id: a.id, name: a.name, image: a.image,
              subtitle: "Artist",
              to: "/artist/$id" as const,
            }))}
          />
        </section>
      )}
      {!!data.playlists.length && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">Playlists</h2>
          <CardGrid
            items={data.playlists.map((p) => ({
              id: p.id, name: p.name, image: p.image,
              subtitle: p.songCount ? `${p.songCount} songs` : undefined,
              to: "/playlist/$id" as const,
            }))}
          />
        </section>
      )}
    </div>
  );
}
