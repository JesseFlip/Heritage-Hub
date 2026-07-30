# 🪷 HeritageHub

A location-aware **Progressive Web App** to discover, share, and RSVP to local cultural, spiritual, and community heritage events — temple groundbreakings, cultural festivals, free feasts, bhajan nights, kids melas, and more.

Built with **Next.js 14 (App Router)**, **Supabase + PostGIS**, **Tailwind CSS**, and **Leaflet**. Ships as an installable, offline-capable PWA.

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
│   │   ├── page.tsx            # Discover feed: geo, filters, radius, map, community + live events
│   │   ├── submit/            # Organizer submission flow (magic-link auth + event form)
│   │   ├── api/events/live/    # Server route: live events from Ticketmaster (key stays secret)
│   │   └── events/[slug]/      # Event detail: itinerary, RSVP, add-to-calendar, share, source link
│   ├── components/             # EventCard, FilterChips, MapView, InstallPrompt, ...
│   ├── lib/                    # supabase clients, geo, geocode, .ics, ticketmaster, data access
│   └── data/events.json        # Real DFW community events (also seeds the DB)
├── public/
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service worker (offline + push)
│   └── icons/                  # App icons (192 / 512 / maskable)
├── supabase/
│   ├── migrations/0001_init.sql # Schema, PostGIS, RLS, events_nearby() RPC
│   └── seed.sql                # Auto-generated sample data
└── scripts/                    # seed + icon generators
```

## Quick start (demo mode — no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys set, the app runs in **demo mode** using the bundled sample events (distance math runs client-side). Great for a first look.

> Prefer zero install? Just open `prototype/index.html` in a browser — the full experience with live filters, map, add-to-calendar, and share.

## Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and fill in your project URL + anon key.
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
| Event detail + granular itinerary | `src/app/events/[slug]/page.tsx` |
| Get Directions / RSVP / Share | detail action bar (Maps deep link, Web Share API) |
| Add to Calendar (.ics + Google) | `src/lib/ics.ts` |
| Add to Home Screen | `InstallPrompt.tsx` + `manifest.webmanifest` |
| Offline caching | `public/sw.js` (shell + tiles + runtime caches) |
| Push notifications | `sw.js` push/notificationclick handlers (wire VAPID for send) |
| Accounts, bookmarks, preferences | `profiles`, `bookmarks`, `rsvps` tables + RLS (Phase 1.5) |
| **Live event data** | `src/lib/ticketmaster.ts` + `/api/events/live` (set `TICKETMASTER_API_KEY`) |
| **Organizer submissions** | `src/app/submit/` (magic-link auth, geocoded form, `create_event` RPC under RLS) |
| **Multilingual organizer guides** | `guides/organizer-guide.html` (8 languages) + `guides/organizer-runbook.md` |

## Where the events come from

The feed blends two real sources (no fabricated data):

1. **Community events** — a curated, verifiable set of real DFW cultural/spiritual/community events (temples, gurdwaras, masjid, cultural festivals). Each links to the organizer's official page via "View official event page"; always confirm exact times there. Edit them in `src/data/events.json`, or let organizers post their own via `/submit`.
2. **Live events** — pulled at runtime from the **Ticketmaster Discovery API** near the user's location when `TICKETMASTER_API_KEY` is set. These show a "Live" badge and open on Ticketmaster.

Organizers add their own events through `/submit` (passwordless email sign-in → form with address geocoding → published under Row Level Security). The friendly step-by-step guide for them lives in `guides/organizer-guide.html` in English, Spanish, Hindi, Gujarati, Punjabi, Chinese, Vietnamese, and Arabic.

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
