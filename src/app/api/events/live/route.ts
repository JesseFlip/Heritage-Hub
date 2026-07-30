import { NextResponse } from "next/server";
import { fetchTicketmasterNearby } from "@/lib/ticketmaster";

/**
 * GET /api/events/live?lat=..&lng=..&radius=..
 * Server-side live events from Ticketmaster (keeps the API key secret).
 * Returns [] when no key is configured, so the client can call it unconditionally.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusMi = Number(searchParams.get("radius") ?? 30);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ events: [] }, { status: 400 });
  }

  const events = await fetchTicketmasterNearby({ lat, lng, radiusMi });
  return NextResponse.json({ events, source: "ticketmaster", count: events.length });
}
