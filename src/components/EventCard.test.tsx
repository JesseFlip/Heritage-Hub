import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EventCard from "./EventCard";
import type { HeritageEvent } from "@/lib/types";

const event: HeritageEvent = {
  id: "diwali-mela",
  slug: "diwali-mela",
  title: "Diwali Mela & Fireworks",
  organizer: "DFW Hindu Temple Society",
  description: "",
  category: ["Spiritual", "Kids Activities"],
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
  distanceMi: 4.2,
};

describe("EventCard", () => {
  it("renders the event title, venue, and distance", () => {
    render(<EventCard event={event} saved={false} onToggleSave={vi.fn()} />);
    expect(screen.getByText("Diwali Mela & Fireworks")).toBeInTheDocument();
    expect(screen.getByText(/Community Hall/)).toBeInTheDocument();
    expect(screen.getByText(/4.2 mi/)).toBeInTheDocument();
  });

  it("calls onToggleSave with the event id when the bookmark button is clicked", async () => {
    const onToggleSave = vi.fn();
    render(<EventCard event={event} saved={false} onToggleSave={onToggleSave} />);
    screen.getByLabelText("Save event").click();
    expect(onToggleSave).toHaveBeenCalledWith("diwali-mela");
  });
});
