"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventBySlug } from "@/lib/events";
import { downloadICS, googleCalendarUrl } from "@/lib/ics";
import { CATEGORY_ICON, type Category, type HeritageEvent } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const [event, setEvent] = useState<HeritageEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEventBySlug(params.slug).then((e) => (e ? setEvent(e) : setNotFound(true)));
    try {
      const s: string[] = JSON.parse(localStorage.getItem("hh-saved") || "[]");
      setSaved(s.includes(params.slug));
    } catch {}
  }, [params.slug]);

  function toggleSave() {
    if (!event) return;
    try {
      const s: string[] = JSON.parse(localStorage.getItem("hh-saved") || "[]");
      const next = s.includes(event.id) ? s.filter((x) => x !== event.id) : [...s, event.id];
      localStorage.setItem("hh-saved", JSON.stringify(next));
      setSaved(next.includes(event.id));
    } catch {}
  }

  async function share() {
    if (!event) return;
    const text = `${event.title}\n${event.venueName}, ${event.address}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url: location.href });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      alert("Event details copied to clipboard.");
    } catch {}
  }

  if (notFound)
    return (
      <div className="p-8 text-center">
        <p className="muted">Event not found.</p>
        <Link href="/" className="mt-3 inline-block font-semibold" style={{ color: "#b91c1c" }}>
          ← Back to discover
        </Link>
      </div>
    );

  if (!event) return <div className="p-8 text-center muted">Loading…</div>;

  const when = `${new Date(event.startsAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${new Date(event.startsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} – ${new Date(event.endsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <main className="pb-32">
      <div
        className="relative flex h-52 items-center justify-center"
        style={{ background: `linear-gradient(135deg,${event.gradient[0]},${event.gradient[1]})` }}
      >
        <Link href="/" className="absolute left-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-xl text-white backdrop-blur" aria-label="Back">
          ←
        </Link>
        <button onClick={toggleSave} className="absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg text-white backdrop-blur" aria-label="Save">
          {saved ? "❤️" : "🤍"}
        </button>
        <span className="text-[88px] drop-shadow-xl">{event.heroEmoji}</span>
      </div>

      <div className="px-[18px] py-[18px]">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">{event.title}</h1>
        <p className="mt-1 text-sm muted">by {event.organizer}</p>

        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold underline"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            ↗ View official event page — please confirm exact date &amp; time
          </a>
        )}

        <div className="my-3 flex flex-wrap gap-1.5">
          {event.category.map((c: Category) => (
            <span key={c} className="cat-pill">
              {CATEGORY_ICON[c]} {c}
            </span>
          ))}
        </div>

        <div className="my-3.5 space-y-2.5">
          <InfoCard icon="📅" title="When" value={when} />
          <InfoCard icon="📍" title="Where" value={`${event.venueName} · ${event.address}`} />
          <InfoCard icon="🎟️" title="Admission" value={event.priceLabel} />
        </div>

        <p className="my-3.5 text-[15px] opacity-90">{event.description}</p>

        <h2 className="mb-2.5 mt-5 text-base font-extrabold">Itinerary</h2>
        <div>
          {event.itinerary.map((s, i) => (
            <div key={i} className="flex gap-3.5 border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--border)" }}>
              <div className="min-w-[70px] text-[13.5px] font-extrabold" style={{ color: "#b91c1c" }}>
                {s.time}
              </div>
              <div className="text-[14.5px]">{s.activity}</div>
            </div>
          ))}
        </div>

        <h2 className="mb-2.5 mt-5 text-base font-extrabold">Location</h2>
        <MapView origin={{ lat: event.lat, lng: event.lng }} events={[event]} height={170} />
      </div>

      {/* Action bar */}
      <div
        className="fixed bottom-0 left-1/2 z-[61] flex w-full max-w-app -translate-x-1/2 gap-2.5 border-t px-4 py-3 backdrop-blur"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb,var(--bg) 92%,transparent)" }}
      >
        <a
          href={event.rsvpUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-xl py-3.5 text-center text-[15px] font-extrabold text-white shadow-soft"
          style={{ background: "#b91c1c" }}
        >
          RSVP · Get Tickets
        </a>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="surface grid w-[52px] place-items-center rounded-xl text-lg shadow-soft" title="Add to Google Calendar">
          📆
        </a>
        <button onClick={() => downloadICS(event)} className="surface grid w-[52px] place-items-center rounded-xl text-lg shadow-soft" title="Download .ics">
          ⬇️
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`}
          target="_blank"
          rel="noreferrer"
          className="surface grid w-[52px] place-items-center rounded-xl text-lg shadow-soft"
          title="Directions"
        >
          🧭
        </a>
        <button onClick={share} className="surface grid w-[52px] place-items-center rounded-xl text-lg shadow-soft" title="Share">
          ↗
        </button>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="surface flex items-center gap-3 rounded-xl px-3.5 py-3 shadow-soft">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide muted">{title}</div>
        <div className="text-[14.5px] font-semibold">{value}</div>
      </div>
    </div>
  );
}
