import type { Category, HeritageEvent } from "@/lib/types";

/**
 * Ticketmaster Discovery API integration — runs entirely client-side.
 *
 * GitHub Pages only serves static files, so there's no server to keep an API
 * key secret behind. Ticketmaster's Discovery API is a public, read-only,
 * rate-limited-per-key endpoint designed for this kind of direct client use
 * (https://developer.ticketmaster.com); restrict the key to your domain in
 * the Ticketmaster developer portal. Get a free key and set it as
 * NEXT_PUBLIC_TICKETMASTER_API_KEY to enable the "Live" feed — it's entirely
 * optional and the app works fine without it.
 */

const EMOJI_BY_SEGMENT: Record<string, string> = {
  "Arts & Theatre": "🎭",
  Music: "🎶",
  Miscellaneous: "🎉",
  Family: "🎈",
};

// Map Ticketmaster classifications onto HeritageHub categories (best-effort).
function mapCategories(cl: any): Category[] {
  const seg = cl?.segment?.name ?? "";
  const genre = cl?.genre?.name ?? "";
  const out = new Set<Category>();
  if (seg === "Music") out.add("Live Music/Bhajan");
  if (seg === "Arts & Theatre") out.add("Live Music/Bhajan");
  if (seg === "Family" || genre === "Children's Theatre") out.add("Kids Activities");
  if (/cultural|festival|community|fair/i.test(genre)) out.add("Spiritual");
  if (out.size === 0) out.add("Live Music/Bhajan");
  return [...out];
}

function pickImage(images: any[] = []): string | undefined {
  const wide = images.find((i) => i.ratio === "16_9" && i.width >= 640);
  return (wide ?? images[0])?.url;
}

/** Fetch cultural/community events near a point from Ticketmaster. Returns [] without a key. */
export async function fetchTicketmasterNearby(params: {
  lat: number;
  lng: number;
  radiusMi: number;
  size?: number;
}): Promise<HeritageEvent[]> {
  const key = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
  if (!key) return [];

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("latlong", `${params.lat},${params.lng}`);
  url.searchParams.set("radius", String(Math.round(params.radiusMi)));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("size", String(params.size ?? 40));
  url.searchParams.set("sort", "date,asc");
  // Cultural / community-leaning segments; drops big-ticket sports.
  url.searchParams.set("segmentName", "Arts & Theatre,Music,Family,Miscellaneous");
  url.searchParams.set("keyword", "cultural festival heritage community");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = await res.json();
  const events = data?._embedded?.events ?? [];

  return events
    .map((e: any): HeritageEvent | null => {
      const venue = e?._embedded?.venues?.[0];
      const loc = venue?.location;
      if (!loc?.latitude || !loc?.longitude) return null;
      const start = e?.dates?.start?.dateTime ?? e?.dates?.start?.localDate;
      if (!start) return null;
      const cl = e?.classifications?.[0];
      const seg = cl?.segment?.name ?? "";

      return {
        id: `tm-${e.id}`,
        slug: `tm-${e.id}`,
        title: e.name,
        organizer: e?.promoter?.name ?? venue?.name ?? "Ticketmaster",
        description: e?.info ?? e?.pleaseNote ?? `${e.name} — presented at ${venue?.name ?? "venue"}.`,
        category: mapCategories(cl),
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(new Date(start).getTime() + 3 * 3600 * 1000).toISOString(),
        venueName: venue?.name ?? "Venue",
        address: [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode]
          .filter(Boolean)
          .join(", "),
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        flyerUrl: pickImage(e.images),
        heroEmoji: EMOJI_BY_SEGMENT[seg] ?? "🎉",
        gradient: ["#0ea5e9", "#7c3aed"],
        priceLabel: e?.priceRanges?.[0]
          ? `$${Math.round(e.priceRanges[0].min)}+`
          : "See tickets",
        rsvpUrl: e.url,
        sourceUrl: e.url,
        itinerary: [],
        featured: false,
        source: "ticketmaster",
        external: true,
      };
    })
    .filter(Boolean) as HeritageEvent[];
}
