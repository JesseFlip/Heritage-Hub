export const CATEGORIES = [
  "Spiritual",
  "Food/Free Feast",
  "Kids Activities",
  "Live Music/Bhajan",
  "Rituals",
  "Volunteer",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ItineraryItem {
  time: string;
  activity: string;
}

export interface HeritageEvent {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  description: string;
  category: Category[];
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  venueName: string;
  address: string;
  lat: number;
  lng: number;
  flyerUrl?: string | null;
  heroEmoji: string;
  gradient: [string, string];
  priceLabel: string;
  rsvpUrl?: string | null;
  /** Link to the organizer's official page / source for this listing. */
  sourceUrl?: string | null;
  itinerary: ItineraryItem[];
  featured: boolean;
  /** Populated by distance search; miles from the query origin. */
  distanceMi?: number;
  /** Where this listing came from. */
  source?: "community" | "ticketmaster";
  /** True for listings whose detail lives off-site (open externally, no /events page). */
  external?: boolean;
}

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusMi: number;
  categories?: Category[];
  from?: string;
  to?: string;
}

export const CATEGORY_ICON: Record<Category, string> = {
  Spiritual: "🕉️",
  "Food/Free Feast": "🍲",
  "Kids Activities": "🎈",
  "Live Music/Bhajan": "🎶",
  Rituals: "🪔",
  Volunteer: "🤝",
};

export const DEFAULT_ORIGIN = { lat: 32.7767, lng: -96.797, name: "Dallas, TX" };
