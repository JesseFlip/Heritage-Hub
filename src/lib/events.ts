import rawSample from "@/data/events.json";
import { createClient } from "@/lib/supabase/client";
import { haversineMi } from "@/lib/geo";
import type { Category, HeritageEvent, NearbyParams } from "@/lib/types";

/** Normalize bundled JSON into the app's HeritageEvent shape. */
const SAMPLE: HeritageEvent[] = (rawSample as any[]).map((e) => ({
  id: e.id,
  slug: e.id,
  title: e.title,
  organizer: e.organizer,
  description: e.description,
  category: e.category as Category[],
  startsAt: e.startsAt,
  endsAt: e.endsAt,
  venueName: e.venueName,
  address: e.address,
  lat: e.lat,
  lng: e.lng,
  heroEmoji: e.heroEmoji,
  gradient: e.gradient as [string, string],
  priceLabel: e.priceLabel,
  rsvpUrl: e.rsvpUrl,
  sourceUrl: e.sourceUrl ?? null,
  itinerary: e.itinerary,
  featured: e.featured,
  source: "community",
}));

function mapRow(r: any): HeritageEvent {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    organizer: r.organizer,
    description: r.description,
    category: r.categories,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    venueName: r.venue_name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    flyerUrl: r.flyer_url,
    heroEmoji: r.hero_emoji,
    gradient: r.gradient,
    priceLabel: r.price_label,
    rsvpUrl: r.rsvp_url,
    sourceUrl: r.source_url,
    itinerary: r.itinerary,
    featured: r.featured,
    distanceMi: r.distance_mi,
    source: "community",
  };
}

/** Events near a point, within radius, filtered by category — DB or sample fallback. */
export async function getNearbyEvents(p: NearbyParams): Promise<HeritageEvent[]> {
  const supabase = createClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("events_nearby", {
      in_lat: p.lat,
      in_lng: p.lng,
      radius_mi: p.radiusMi,
      in_categories: p.categories?.length ? p.categories : null,
      in_from: p.from ?? new Date().toISOString(),
      in_to: p.to ?? null,
    });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  // ---- Sample fallback (no backend configured) ----
  return SAMPLE.map((e) => ({ ...e, distanceMi: haversineMi(p, e) }))
    .filter((e) => e.distanceMi! <= p.radiusMi)
    .filter((e) => !p.categories?.length || e.category.some((c) => p.categories!.includes(c)))
    .sort((a, b) => a.distanceMi! - b.distanceMi!);
}

export async function getEventBySlug(slug: string): Promise<HeritageEvent | null> {
  const supabase = createClient();
  if (supabase) {
    const { data, error } = await supabase.from("events").select(
      "id,slug,title,organizer,description,categories,starts_at,ends_at,venue_name,address,flyer_url,hero_emoji,gradient,price_label,rsvp_url,source_url,itinerary,featured"
    ).eq("slug", slug).single();
    if (error) return null;
    // events table returns location, not lat/lng — fetch coords via the view-less approach:
    return data ? mapRow({ ...data, lat: (data as any).lat, lng: (data as any).lng }) : null;
  }
  return SAMPLE.find((e) => e.slug === slug) ?? null;
}

export function getSampleEvents(): HeritageEvent[] {
  return SAMPLE;
}

/** Live events from the server route (Ticketmaster). Returns [] if unavailable. */
export async function getLiveEvents(p: NearbyParams): Promise<HeritageEvent[]> {
  try {
    const res = await fetch(
      `/api/events/live?lat=${p.lat}&lng=${p.lng}&radius=${p.radiusMi}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const events: HeritageEvent[] = data.events ?? [];
    return events
      .map((e) => ({ ...e, distanceMi: haversineMi(p, e) }))
      .filter((e) => !p.categories?.length || e.category.some((c) => p.categories!.includes(c)));
  } catch {
    return [];
  }
}
