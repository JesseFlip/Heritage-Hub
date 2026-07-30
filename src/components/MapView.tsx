"use client";

import { useEffect, useRef } from "react";
import type { HeritageEvent } from "@/lib/types";

/**
 * Leaflet map. Imported dynamically (ssr:false) by callers because Leaflet
 * needs `window`. Defaults to free OpenStreetMap tiles; switches to Mapbox
 * automatically when NEXT_PUBLIC_MAPBOX_TOKEN is set.
 */
export default function MapView({
  origin,
  events,
  height = 230,
  onSelect,
}: {
  origin: { lat: number; lng: number };
  events: HeritageEvent[];
  height?: number;
  onSelect?: (slug: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(ref.current, { zoomControl: false }).setView(
          [origin.lat, origin.lng],
          10
        );
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (token) {
          L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`,
            { attribution: "© Mapbox © OpenStreetMap", tileSize: 512, zoomOffset: -1 }
          ).addTo(mapRef.current);
        } else {
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
          }).addTo(mapRef.current);
        }
      }

      const map = mapRef.current;
      map.setView([origin.lat, origin.lng]);
      if (layerRef.current) map.removeLayer(layerRef.current);
      const group = L.layerGroup().addTo(map);
      layerRef.current = group;

      L.circleMarker([origin.lat, origin.lng], {
        radius: 7,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 1,
      })
        .addTo(group)
        .bindPopup("You are here");

      events.forEach((e) => {
        const m = L.marker([e.lat, e.lng]).addTo(group).bindPopup(
          `<b>${e.heroEmoji} ${e.title}</b><br/>${e.venueName}`
        );
        if (onSelect) m.on("click", () => onSelect(e.slug));
      });

      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
    };
  }, [origin, events, onSelect]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className="surface rounded-2xl shadow-soft"
      style={{ height }}
      role="application"
      aria-label="Map of nearby events"
    />
  );
}
