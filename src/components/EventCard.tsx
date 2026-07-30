"use client";

import Link from "next/link";
import type { HeritageEvent } from "@/lib/types";

function fmtWhen(e: HeritageEvent) {
  const s = new Date(e.startsAt);
  const en = new Date(e.endsAt);
  const date = s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${t(s)} – ${t(en)}`;
}

export default function EventCard({
  event,
  saved,
  onToggleSave,
}: {
  event: HeritageEvent;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const cls = "surface block overflow-hidden rounded-2xl shadow-soft transition active:scale-[.99]";
  const inner = (
    <>
      <div
        className="relative flex h-28 items-center justify-center"
        style={{ background: `linear-gradient(135deg,${event.gradient[0]},${event.gradient[1]})` }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSave(event.id);
          }}
          aria-label={saved ? "Remove bookmark" : "Save event"}
          className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-base backdrop-blur"
        >
          {saved ? "❤️" : "🤍"}
        </button>
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
          {event.priceLabel}
        </span>
        <span className="text-5xl drop-shadow-lg">{event.heroEmoji}</span>
      </div>
      <div className="p-3.5">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {event.category.slice(0, 3).map((c) => (
            <span key={c} className="cat-pill">
              {c}
            </span>
          ))}
          {event.source === "ticketmaster" && (
            <span className="cat-pill" style={{ background: "#e0f2fe", color: "#075985" }}>
              ● Live
            </span>
          )}
        </div>
        <h3 className="text-[15.5px] font-semibold leading-tight tracking-tight">{event.title}</h3>
        <div className="mt-1.5 space-y-1 text-[13px] muted">
          <div>📅 <span className="font-semibold" style={{ color: "var(--text)" }}>{fmtWhen(event)}</span></div>
          <div>
            📍 {event.venueName}
            {event.distanceMi != null && (
              <span className="font-bold" style={{ color: "#b91c1c" }}> · {event.distanceMi.toFixed(1)} mi</span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Community events open the in-app detail page; live (external) events open off-site.
  if (event.external) {
    return (
      <a href={event.rsvpUrl ?? "#"} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={`/events/${event.slug}`} className={cls}>
      {inner}
    </Link>
  );
}
