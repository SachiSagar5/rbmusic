# RB Music

A full-stack music streaming web app built with **TanStack Start**. Discover trending songs, browse albums and artists, play music with an equalizer & volume boost, create local playlists, and download songs for offline listening.

> **Frontend and backend live in the same codebase.** TanStack Start handles both the React UI and the server functions / API routes, so you run everything with one command.

## Features

- **Home feed** – Trending Now, Top Charts, New Releases, Bollywood, English, Punjabi, Romantic, and Popular Artists.
- **Search** – Find songs, albums, artists, and playlists.
- **Album & Artist pages** – Click any album or artist to see all tracks and play them.
- **Playlists** – Browse featured playlists and create your own local playlists.
- **Lyrics & Queue** – View song lyrics, manage the play queue, and use shuffle/repeat.
- **Equalizer & Volume Boost** – 5-band EQ with presets and a boost slider for quiet tracks.
- **Downloads** – Save songs to your device and play them offline inside the app.

## Tech Stack

- **Framework:** TanStack Start (full-stack React)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui components
- **Backend:** TanStack server functions + API routes (no separate backend server needed)
- **State & Data:** TanStack Query, localStorage, IndexedDB
- **Music API:** Public Saavn API instance

## Project Structure

```
rbmusic/
├── src/
│   ├── components/          # Reusable UI components (PlayerBar, SongList, CardGrid, etc.)
│   ├── lib/
│   │   ├── saavn.ts         # API client for music data
│   │   ├── player.tsx       # Global audio player context (Web Audio EQ, queue, shuffle, repeat)
│   │   ├── library.ts       # Likes, local playlists, downloads metadata
│   │   └── idb.ts           # IndexedDB helper for offline audio blobs
│   ├── routes/              # TanStack Start routes
│   │   ├── index.tsx        # Home / landing page
│   │   ├── album.$id.tsx    # Album details
│   │   ├── artist.$id.tsx   # Artist details
│   │   ├── playlists.tsx    # Featured playlists
│   │   ├── playlist.$id.tsx# Playlist details
│   │   ├── library.tsx      # Your library (likes, playlists, downloads)
│   │   └── __root.tsx       # Root layout with PlayerProvider
│   └── styles.css           # Global styles and theme tokens
├── package.json
├── vite.config.ts
└── README.md
```

## Prerequisites

- **Node.js** 18+ (recommended: install via [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **bun**

This project uses a `bun.lock` file, so **Bun** is the preferred package manager, but npm works too.

## Install Dependencies

```bash
# Clone the repository
git clone https://github.com/SachiSagar5/rbmusic.git
cd rbmusic

# With Bun (recommended)
bun install

# Or with npm
npm install
```

## Run the App (Frontend + Backend Together)

TanStack Start serves the React frontend and the server functions / API routes from the same Vite dev server.

```bash
# With Bun
bun run dev

# Or with npm
npm run dev
```

Then open your browser at:

```
http://localhost:8080
```

That’s it — both the frontend UI and backend server functions are running on that single port.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` / `npm run dev` | Start the full-stack dev server |
| `bun run build` / `npm run build` | Build for production |
| `bun run preview` / `npm run preview` | Preview the production build locally |
| `bun run lint` / `npm run lint` | Run ESLint |
| `bun run format` / `npm run format` | Format code with Prettier |

## How the Backend Works

There is **no separate backend folder**. Server-side code lives inside `src/` as part of TanStack Start:

- **Server functions** (`src/lib/*.functions.ts`) are called directly from React components. They run on the server and can safely call external APIs or access secrets.
- **API routes** (`src/routes/api/`) are used for raw HTTP endpoints like webhooks or public APIs.

In this app, most data flows from the Saavn API through client-side fetch calls in `src/lib/saavn.ts`. Server functions are ready to use whenever you need server-only logic (e.g., hiding API keys, handling webhooks, or adding authentication).

## Notes

- The app streams music from a public Saavn API instance. No API key is required for the current features.
- Offline downloads are stored in your browser’s **IndexedDB** and are local to that browser/device.
- Local playlists and liked songs are saved to **localStorage** and stay in the current browser.

## License

This project is open source and available under the MIT License.
