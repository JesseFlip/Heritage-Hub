# 🪷 HeritageHub

A location-aware **Progressive Web App** to discover, share, and RSVP to local cultural, spiritual, and community heritage events — temple groundbreakings, cultural festivals, free feasts, bhajan nights, kids melas, and more.

Built with **Next.js 16 (App Router, static export)**, **React 19**, **Tailwind CSS 4**, **Supabase + PostGIS** (optional), and **Leaflet**. Ships as an installable, offline-capable PWA, and deploys as a fully static site to **GitHub Pages**.

---

## What's in the box

```
heritagehub/
├── prototype/index.html        # Zero-install clickable prototype (open in any browser)
├── guides/
│   ├── organizer-guide.html    # Friendly organizer guide in 8 languages (EN/ES/HI/GU/PA/ZH/VI/AR)
│   └── organizer-runbook.md    # Ops runbook for supporting organizer submissions
├── src/
│   ├── app/
│   │   ├── page.tsx             # Discover feed: geo, filters, radius, map, community + live events
│   │   ├── submit/               # Organizer submission flow (magic-link auth + event form)
│   │   ├── events/[slug]/        # Event detail: itinerary, RSVP, add-to-calendar, share, source link
│   │   └── not-found.tsx         # GitHub Pages 404 fallback for slugs added after the last deploy
│   ├── components/               # EventCard, EventDetail, FilterChips, MapView, InstallPrompt, ...
│   ├── lib/                      # supabase client, geo, geocode, .ics, ticketmaster, data access
│   └── data/events.json          # Real DFW community events (also seeds the DB)
├── public/
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service worker (offline + push)
│   └── icons/                  # App icons (192 / 512 / maskable)
├── supabase/
│   ├── migrations/0001_init.sql # Schema, PostGIS, RLS, events_nearby() RPC
│   └── seed.sql                # Auto-generated sample data
├── .github/workflows/          # CI (lint/typecheck/test/build) + CD (deploy to GitHub Pages)
└── scripts/                    # seed + icon generators
```

## Quick start (demo mode — no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys set, the app runs in **demo mode** using the bundled sample events (distance math runs client-side). Great for a first look.

> Prefer zero install? Just open `prototype/index.html` in a browser — the full experience with live filters, map, add-to-calendar, and share.

## Deploying to GitHub Pages

The site builds to a fully static export (`next build` → `out/`) and ships via the included GitHub Actions workflows — no server required.

1. **Enable Pages**: in the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.
2. **Push to `main`**: `.github/workflows/deploy.yml` builds the static export and publishes it automatically. You can also trigger it manually from the **Actions** tab (`workflow_dispatch`).
3. Your site goes live at `https://<user>.github.io/<repo>/`.

The build derives its `basePath` from `GITHUB_REPOSITORY` automatically (see `next.config.mjs`), so links, assets, the manifest, and the service worker all resolve correctly under the `/<repo>/` sub-path — no manual configuration needed. Using a custom domain instead? Set the `NEXT_PUBLIC_BASE_PATH` repository variable to `""`.

Optional repository **secrets** (Settings → Secrets and variables → Actions) are picked up at build time by both workflows — see `.env.example`:

| Secret | Enables |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-backed events, organizer submissions, bookmarks |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox tiles instead of free OpenStreetMap |
| `NEXT_PUBLIC_TICKETMASTER_API_KEY` | The "Live" Ticketmaster events feed |

None are required — the app works fully in demo mode with just the bundled sample events.

### Static export constraints (why some things work differently here)

GitHub Pages only serves static files, so this app runs entirely client-side:

- **No API routes / server secrets.** The old `/api/events/live` server route is gone. Ticketmaster's Discovery API is called directly from the browser instead (`src/lib/ticketmaster.ts`) — it's a public, rate-limited-per-key, read-only endpoint designed for this; restrict your key to your domain in the Ticketmaster developer portal.
- **Only known event slugs are pre-rendered.** `/events/[slug]` pages are generated at build time for the bundled `src/data/events.json` events (`generateStaticParams`). A slug that only exists in Supabase (e.g. a fresh organizer submission) isn't pre-rendered; GitHub Pages serves the custom `404.html` for it, and `src/app/not-found.tsx` redirects client-side to `/?event=<slug>`, where the home page fetches and opens it directly. Deploy again to pre-render newly added community events.
- **Supabase auth still works.** The organizer sign-in flow uses `@supabase/ssr`'s browser client only (no server component/cookie round-trip), so magic-link sign-in works fine from a static host.

## Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and fill in your project URL + anon key (and add the same as GitHub Actions secrets for deploys).
3. Apply the schema and seed data:
   ```bash
   # Option A: Supabase CLI
   supabase db reset            # runs migrations/0001_init.sql
   npm run db:seed              # loads supabase/seed.sql

   # Option B: paste supabase/migrations/0001_init.sql then supabase/seed.sql
   #           into the Supabase SQL editor
   ```
4. Enable **Google** and **Apple** providers under Authentication → Providers (Phase 1.5 auth).
5. `npm run dev` — the app now reads live events via the `events_nearby()` geo RPC.

Regenerate `seed.sql` after editing `src/data/events.json`:
```bash
node scripts/gen-seed.mjs
```

## Feature map → PRD

| PRD requirement | Where |
|---|---|
| Geolocation + configurable radius | `src/app/page.tsx`, `src/lib/geo.ts` |
| Interactive map with event pins | `src/components/MapView.tsx` (Leaflet; Mapbox via env) |
| Filter by category / distance / search | `FilterChips.tsx`, radius slider, search box |
| Efficient geo-spatial queries | `events_nearby()` PostGIS RPC (`ST_DWithin` + GiST index) |
| Event detail + granular itinerary | `src/app/events/[slug]/page.tsx`, `src/components/EventDetail.tsx` |
| Get Directions / RSVP / Share | detail action bar (Maps deep link, Web Share API) |
| Add to Calendar (.ics + Google) | `src/lib/ics.ts` |
| Add to Home Screen | `InstallPrompt.tsx` + `manifest.webmanifest` |
| Offline caching | `public/sw.js` (shell + tiles + runtime caches) |
| Push notifications | `sw.js` push/notificationclick handlers (wire VAPID for send) |
| Accounts, bookmarks, preferences | `profiles`, `bookmarks`, `rsvps` tables + RLS (Phase 1.5) |
| **Live event data** | `src/lib/ticketmaster.ts` (client-side; set `NEXT_PUBLIC_TICKETMASTER_API_KEY`) |
| **Organizer submissions** | `src/app/submit/` (magic-link auth, geocoded form, `create_event` RPC under RLS) |
| **Multilingual organizer guides** | `guides/organizer-guide.html` (8 languages) + `guides/organizer-runbook.md` |

## Where the events come from

The feed blends two real sources (no fabricated data):

1. **Community events** — a curated, verifiable set of real DFW cultural/spiritual/community events (temples, gurdwaras, masjid, cultural festivals). Each links to the organizer's official page via "View official event page"; always confirm exact times there. Edit them in `src/data/events.json`, or let organizers post their own via `/submit`.
2. **Live events** — pulled at runtime from the **Ticketmaster Discovery API** near the user's location when `NEXT_PUBLIC_TICKETMASTER_API_KEY` is set. These show a "Live" badge and open on Ticketmaster.

Organizers add their own events through `/submit` (passwordless email sign-in → form with address geocoding → published under Row Level Security). The friendly step-by-step guide for them lives in `guides/organizer-guide.html` in English, Spanish, Hindi, Gujarati, Punjabi, Chinese, Vietnamese, and Arabic.

## Tech stack

- **Next.js 16** (App Router, `output: "export"`) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** (CSS-first config, no `tailwind.config.js`)
- **ESLint 9** flat config (`eslint.config.mjs`) via `eslint-config-next`
- **Vitest** + **React Testing Library** for unit tests
- **Supabase** (`@supabase/ssr` browser client, `@supabase/supabase-js`) — optional
- **Leaflet** for maps; free OpenStreetMap tiles by default, Mapbox via env
- **GitHub Actions** — CI (lint, typecheck, test, build) on every push/PR; CD (build + deploy) to GitHub Pages on `main`

## Development

```bash
npm install
npm run dev          # local dev server
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test               # Vitest
npm run build          # static export → out/
npm run preview        # serve the built out/ directory locally
```

## Tech notes

- **Maps default to free OpenStreetMap tiles** (no API key). Set `NEXT_PUBLIC_MAPBOX_TOKEN` to switch to Mapbox.
- **Row Level Security** is on for every table; published events are world-readable, everything user-owned is scoped to `auth.uid()`.
- **Distances** are computed in Postgres (`geography` type, meters) and surfaced in miles.
- The prototype and the app share one source of truth: `src/data/events.json`.

## Roadmap (from PRD)

- **Phase 1.5** — Social login, saved events synced to account, preference-based defaults.
- **V2** — Organizer dashboard with flyer OCR to auto-populate itineraries, event forums for carpools, in-app donations/tipping.

---

Built from the HeritageHub PRD. Sample data is fictional and for demonstration.
