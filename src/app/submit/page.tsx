"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, hasSupabase } from "@/lib/supabase/client";
import { geocodeAddress } from "@/lib/geocode";
import { CATEGORIES, CATEGORY_ICON, type Category } from "@/lib/types";

type Step = { time: string; activity: string };

const EMPTY = {
  title: "",
  organizer: "",
  description: "",
  categories: [] as Category[],
  date: "",
  startTime: "18:00",
  endTime: "21:00",
  venueName: "",
  address: "",
  lat: null as number | null,
  lng: null as number | null,
  heroEmoji: "🎉",
  priceLabel: "Free",
  rsvpUrl: "",
  sourceUrl: "",
  itinerary: [{ time: "", activity: "" }] as Step[],
};

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) +
    "-" +
    Math.floor(performance.now() % 100000)
  );
}

export default function SubmitPage() {
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ ...EMPTY });
  const [geoStatus, setGeoStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function toggleCat(c: Category) {
    setF((prev) => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter((x) => x !== c)
        : [...prev.categories, c],
    }));
  }

  async function locate() {
    setGeoStatus("Locating…");
    const r = await geocodeAddress(f.address);
    if (r) {
      setF((prev) => ({ ...prev, lat: r.lat, lng: r.lng }));
      setGeoStatus(`✓ Found: ${r.label.slice(0, 60)}…`);
    } else {
      setGeoStatus("Couldn't find that address — check spelling or enter coordinates manually.");
    }
  }

  async function signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/submit` },
    });
    setSent(true);
  }

  function validate(): string | null {
    if (!f.title.trim()) return "Please add an event title.";
    if (!f.organizer.trim()) return "Please add the organizer name.";
    if (f.categories.length === 0) return "Pick at least one category.";
    if (!f.date) return "Please choose a date.";
    if (!f.venueName.trim() || !f.address.trim()) return "Please add the venue name and address.";
    if (f.lat == null || f.lng == null) return "Tap “Find on map” to locate the address.";
    return null;
  }

  async function submit() {
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    const startsAt = new Date(`${f.date}T${f.startTime}`).toISOString();
    const endsAt = new Date(`${f.date}T${f.endTime}`).toISOString();
    const itinerary = f.itinerary.filter((s) => s.time && s.activity);

    // Demo mode: no backend — show a preview success rather than persisting.
    if (!supabase) {
      setTimeout(() => {
        setSubmitting(false);
        setDone(true);
      }, 500);
      return;
    }

    const { error } = await supabase.rpc("create_event", {
      p_slug: slugify(f.title),
      p_title: f.title,
      p_organizer: f.organizer,
      p_description: f.description,
      p_categories: f.categories,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_venue_name: f.venueName,
      p_address: f.address,
      p_lat: f.lat,
      p_lng: f.lng,
      p_hero_emoji: f.heroEmoji,
      p_price_label: f.priceLabel,
      p_rsvp_url: f.rsvpUrl || null,
      p_source_url: f.sourceUrl || null,
      p_itinerary: itinerary,
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  // ---------- Success screen ----------
  if (done)
    return (
      <Shell>
        <div className="py-16 text-center">
          <div className="text-6xl">🎉</div>
          <h1 className="mt-4 text-2xl font-extrabold">Event submitted!</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm muted">
            {supabase
              ? "Your event is now live on HeritageHub. Thank you for sharing it with the community."
              : "Preview only — connect Supabase to save events for real. Everything you entered is valid and ready."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "#b91c1c" }}>
              Back to events
            </Link>
            <button
              onClick={() => {
                setF({ ...EMPTY });
                setDone(false);
              }}
              className="surface rounded-xl px-4 py-2.5 text-sm font-bold shadow-soft"
            >
              Add another
            </button>
          </div>
        </div>
      </Shell>
    );

  // ---------- Sign-in gate (only when Supabase is configured) ----------
  if (supabase && !session)
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold tracking-tight">Add your event</h1>
        <p className="mt-1 text-sm muted">Sign in to post an event. We&rsquo;ll email you a magic link — no password.</p>
        {sent ? (
          <div className="surface mt-5 rounded-xl p-4 text-sm shadow-soft">
            ✉️ Check <b>{email}</b> for a sign-in link, then return here.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              className="surface w-full rounded-xl px-3 py-3 text-[15px] outline-none shadow-soft"
              style={{ color: "var(--text)" }}
            />
            <button
              onClick={signIn}
              disabled={!email.includes("@")}
              className="w-full rounded-xl py-3 text-sm font-extrabold text-white disabled:opacity-50"
              style={{ background: "#b91c1c" }}
            >
              Email me a sign-in link
            </button>
            <p className="text-center text-xs muted">
              Google &amp; Apple sign-in can be enabled in Supabase → Auth → Providers.
            </p>
          </div>
        )}
      </Shell>
    );

  // ---------- The form ----------
  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Add your event</h1>
        {supabase && (
          <button onClick={() => supabase.auth.signOut()} className="text-xs font-semibold muted underline">
            Sign out
          </button>
        )}
      </div>
      <p className="mt-1 text-sm muted">
        Fill in what you can — required fields are marked <span style={{ color: "#b91c1c" }}>*</span>. Need help?{" "}
        See the organizer guide.
      </p>

      {!hasSupabase() && (
        <div className="mt-4 rounded-xl px-3 py-2.5 text-[12px] font-semibold" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
          Demo mode — submissions are validated and previewed but not saved. Add Supabase keys to go live.
        </div>
      )}

      <div className="mt-5 space-y-5">
        <Field label="Event title" req>
          <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Diwali Mela & Fireworks" />
        </Field>

        <Field label="Organizer / hosting group" req>
          <input className={inputCls} value={f.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="e.g. DFW Hindu Temple Society" />
        </Field>

        <Field label="Categories" req hint="Pick all that apply">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = f.categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${on ? "text-white" : "muted"}`}
                  style={on ? { background: "#b91c1c", borderColor: "#b91c1c" } : { background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {CATEGORY_ICON[c]} {c}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" req>
            <input type="date" className={inputCls} value={f.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Start">
            <input type="time" className={inputCls} value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="End">
            <input type="time" className={inputCls} value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>

        <Field label="Venue name" req>
          <input className={inputCls} value={f.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="e.g. Ekta Mandir Community Hall" />
        </Field>

        <Field label="Address" req hint="Then tap “Find on map” to place the pin">
          <div className="flex gap-2">
            <input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="1605 N Britain Rd, Irving, TX 75061" />
            <button type="button" onClick={locate} className="shrink-0 rounded-xl px-3 text-sm font-bold text-white" style={{ background: "#7c3aed" }}>
              Find on map
            </button>
          </div>
          {geoStatus && (
            <p className="mt-1.5 text-[12px]" style={{ color: f.lat != null ? "#15803d" : "var(--muted)" }}>
              {geoStatus}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Icon">
            <input className={inputCls} value={f.heroEmoji} onChange={(e) => set("heroEmoji", e.target.value)} maxLength={4} />
          </Field>
          <Field label="Admission">
            <input className={inputCls} value={f.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} placeholder="Free" />
          </Field>
          <Field label="RSVP link">
            <input className={inputCls} value={f.rsvpUrl} onChange={(e) => set("rsvpUrl", e.target.value)} placeholder="https://…" />
          </Field>
        </div>

        <Field label="Description">
          <textarea className={inputCls} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What's happening? Who's it for? Anything to bring?" />
        </Field>

        <Field label="Official page link" hint="Where attendees can verify details">
          <input className={inputCls} value={f.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://your-temple.org/events" />
        </Field>

        <Field label="Itinerary" hint="Optional — add times & activities">
          <div className="space-y-2">
            {f.itinerary.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} w-28`} value={s.time} onChange={(e) => { const it = [...f.itinerary]; it[i] = { ...it[i], time: e.target.value }; set("itinerary", it); }} placeholder="7:00 PM" />
                <input className={inputCls} value={s.activity} onChange={(e) => { const it = [...f.itinerary]; it[i] = { ...it[i], activity: e.target.value }; set("itinerary", it); }} placeholder="Aarti" />
              </div>
            ))}
            <button type="button" onClick={() => set("itinerary", [...f.itinerary, { time: "", activity: "" }])} className="text-[13px] font-bold" style={{ color: "#b91c1c" }}>
              + Add row
            </button>
          </div>
        </Field>

        {error && <p className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-xl py-3.5 text-[15px] font-extrabold text-white shadow-soft disabled:opacity-60"
          style={{ background: "#b91c1c" }}
        >
          {submitting ? "Submitting…" : "Publish event"}
        </button>
      </div>
    </Shell>
  );
}

const inputCls = "surface w-full rounded-xl px-3 py-2.5 text-[15px] outline-none shadow-soft";

function Field({ label, req, hint, children }: { label: string; req?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[13px] font-bold">
        {label} {req && <span style={{ color: "#b91c1c" }}>*</span>}
        {hint && <span className="ml-1 font-normal muted">— {hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 pb-20 pt-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold muted">
        ← Back
      </Link>
      <div className="mt-3">{children}</div>
    </main>
  );
}
