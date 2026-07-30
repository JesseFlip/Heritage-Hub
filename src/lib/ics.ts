import type { HeritageEvent } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toICSDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

/** Build an RFC-5545 VEVENT string for an event. */
export function buildICS(e: HeritageEvent): string {
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HeritageHub//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@heritagehub`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(e.startsAt)}`,
    `DTEND:${toICSDate(e.endsAt)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(`${e.venueName}, ${e.address}`)}`,
    `DESCRIPTION:${esc(e.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a client-side download of the .ics file. */
export function downloadICS(e: HeritageEvent) {
  const blob = new Blob([buildICS(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Google Calendar "add event" deep link (nice on Android / desktop). */
export function googleCalendarUrl(e: HeritageEvent): string {
  const fmt = (iso: string) => toICSDate(iso).replace(/[-:]/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(e.startsAt)}/${fmt(e.endsAt)}`,
    details: e.description,
    location: `${e.venueName}, ${e.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
