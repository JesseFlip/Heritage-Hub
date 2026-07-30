import { describe, expect, it } from "vitest";
import { buildICS, googleCalendarUrl } from "./ics";
import type { HeritageEvent } from "./types";

const event: HeritageEvent = {
  id: "test-event",
  slug: "test-event",
  title: "Diwali Mela",
  organizer: "Test Temple",
  description: "A festival of lights.",
  category: ["Spiritual"],
  startsAt: "2026-11-01T18:00:00-05:00",
  endsAt: "2026-11-01T21:00:00-05:00",
  venueName: "Community Hall",
  address: "123 Main St, Dallas, TX",
  lat: 32.7767,
  lng: -96.797,
  heroEmoji: "🪔",
  gradient: ["#b91c1c", "#f97316"],
  priceLabel: "Free",
  itinerary: [],
  featured: false,
};

describe("buildICS", () => {
  it("produces a valid VEVENT block with escaped fields", () => {
    const ics = buildICS(event);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Diwali Mela");
    expect(ics).toContain("DTSTART:20261101T230000Z");
    expect(ics).toContain("END:VEVENT");
  });
});

describe("googleCalendarUrl", () => {
  it("builds a Google Calendar render link with the event details", () => {
    const url = googleCalendarUrl(event);
    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("text=Diwali+Mela");
    expect(url).toContain("dates=20261101T230000Z%2F20261102T020000Z");
  });
});
