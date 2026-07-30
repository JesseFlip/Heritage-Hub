"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import FilterChips from "@/components/FilterChips";
import InstallPrompt from "@/components/InstallPrompt";
import { getLiveEvents, getNearbyEvents } from "@/lib/events";
import { getBrowserLocation } from "@/lib/geo";
import { DEFAULT_ORIGIN, type Category, type HeritageEvent } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function DiscoverPage() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [radius, setRadius] = useState(30);
  const [active, setActive] = useState<Set<Category>>(new Set());
  const [q, setQ] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [events, setEvents] = useState<HeritageEvent[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  // Load saved bookmarks + theme from localStorage (client-only).
  useEffect(() => {
    try {
      setSaved(new Set(JSON.parse(localStorage.getItem("hh-saved") || "[]")));
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
  }, []);

  // Fetch community + live events whenever the geo/filter inputs change.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = { lat: origin.lat, lng: origin.lng, radiusMi: radius, categories: [...active] };
    Promise.all([getNearbyEvents(params), getLiveEvents(params)])
      .then(([community, live]) => {
        if (!alive) return;
        // Merge, de-dupe by id, sort by distance.
        const byId = new Map<string, HeritageEvent>();
        [...community, ...live].forEach((e) => byId.set(e.id, e));
        const merged = [...byId.values()].sort(
          (a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0)
        );
        setEvents(merged);
        setLiveCount(live.length);
      })
      .catch(() => alive && setEvents([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [origin, radius, active]);

  const visible = useMemo(() => {
    if (!q) return events;
    const needle = q.toLowerCase();
    return events.filter((e) =>
      `${e.title}${e.organizer}${e.venueName}${e.address}${e.category.join(" ")}`
        .toLowerCase()
        .includes(needle)
    );
  }, [events, q]);

  function toggleCat(c: Category) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem("hh-saved", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  async function useMyLocation() {
    try {
      const loc = await getBrowserLocation();
      setOrigin({ ...loc, name: "Your location" });
    } catch {
      alert("Location permission denied — showing Dallas, TX.");
    }
  }

  function toggleTheme() {
    const on = document.documentElement.classList.toggle("dark");
    setDark(on);
    try {
      localStorage.setItem("hh-theme", on ? "dark" : "light");
    } catch {}
  }

  return (
    <main className="pb-8">
      <header
        className="sticky top-0 z-40 border-b px-4 pb-2.5 pt-3.5 backdrop-blur"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb,var(--bg) 88%,transparent)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-lg shadow-soft" style={{ background: "linear-gradient(135deg,#b91c1c,#f97316)" }}>
            🪷
          </div>
          <div className="text-[19px] font-extrabold tracking-tight">
            Heritage<span style={{ color: "#b91c1c" }}>Hub</span>
          </div>
          <button onClick={toggleTheme} className="surface ml-auto grid h-9 w-9 place-items-center rounded-xl text-base shadow-soft" aria-label="Toggle theme">
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[13px] muted">
          📍 Showing events near <b style={{ color: "var(--text)" }}>{origin.name}</b>
          <button onClick={useMyLocation} className="font-semibold" style={{ color: "#b91c1c" }}>
            Use my location
          </button>
        </div>
        <div className="surface mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-soft">
          🔎
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, temples, festivals…"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: "var(--text)" }}
          />
        </div>
      </header>

      <FilterChips active={active} onToggle={toggleCat} />

      <div className="flex items-center gap-3 px-4 pb-1 pt-2">
        <label className="whitespace-nowrap text-xs font-semibold muted">Within</label>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={radius}
          onChange={(e) => setRadius(+e.target.value)}
          className="flex-1"
          style={{ accentColor: "#b91c1c" }}
        />
        <span className="min-w-[52px] text-right text-[13px] font-bold" style={{ color: "#b91c1c" }}>
          {radius} mi
        </span>
      </div>

      <div className="px-4 pt-3">
        <button
          onClick={() => setShowMap((s) => !s)}
          className="surface flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-bold shadow-soft"
        >
          🗺️ {showMap ? "Hide map view" : "Show map view"}
        </button>
      </div>
      {showMap && (
        <div className="px-4 pt-3">
          <MapView origin={origin} events={visible} />
        </div>
      )}

      <InstallPrompt />

      <div
        className="mx-4 mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold"
        style={{ background: "var(--surface-2)", color: "var(--muted)" }}
      >
        <span className="text-base leading-none">ℹ️</span>
        <span>
          Showing <strong style={{ color: "var(--text)" }}>real DFW community events</strong> from
          organizers&rsquo; official pages
          {liveCount > 0 ? (
            <> + <strong style={{ color: "var(--text)" }}>{liveCount} live</strong> from Ticketmaster</>
          ) : null}
          . Always confirm exact times on the event&rsquo;s official page. Organizers can{" "}
          <a href="/submit" className="underline" style={{ color: "#b91c1c" }}>add an event</a>.
        </span>
      </div>

      <div className="flex items-baseline gap-2 px-4 pb-2 pt-4">
        <h2 className="text-[17px] font-extrabold tracking-tight">Upcoming near you</h2>
        <span className="text-[13px] font-semibold muted">
          {loading ? "…" : `${visible.length} event${visible.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="flex flex-col gap-3.5 px-4">
        {visible.length === 0 && !loading ? (
          <p className="px-6 py-10 text-center text-sm muted">
            No events match your filters. Try widening the radius or clearing filters.
          </p>
        ) : (
          visible.map((e) => (
            <EventCard key={e.id} event={e} saved={saved.has(e.id)} onToggleSave={toggleSave} />
          ))
        )}
      </div>
    </main>
  );
}
