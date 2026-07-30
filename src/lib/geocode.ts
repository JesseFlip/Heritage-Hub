/**
 * Geocode a street address to lat/lng using OpenStreetMap Nominatim (no key).
 * Note: Nominatim asks for light usage — fine for organizer form submissions.
 * For high volume, swap in a paid geocoder.
 */
export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    };
  } catch {
    return null;
  }
}
