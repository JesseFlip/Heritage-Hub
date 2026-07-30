"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * GitHub Pages has no server-side rewrites, so it serves this page (built to
 * 404.html by `next build` with output:"export") for any path it can't find
 * a static file for. That includes event detail pages for slugs added after
 * the last deploy (e.g. organizer submissions via Supabase), since only the
 * bundled sample events are pre-rendered at build time.
 *
 * If the missing path looks like an event permalink, redirect to the home
 * page with an `?event=` query param — DiscoverPage picks that up and opens
 * the event client-side by fetching it directly by slug.
 */
export default function NotFound() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    let path = location.pathname;
    if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length);

    const match = path.match(/^\/events\/([^/]+)\/?$/);
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- location.pathname is only known client-side; this is the 404 page's one-time redirect decision, not a synchronization loop.
      setRedirecting(true);
      location.replace(`${basePath}/?event=${encodeURIComponent(match[1])}`);
    }
  }, []);

  if (redirecting) return <div className="p-8 text-center muted">Loading…</div>;

  return (
    <div className="p-8 text-center">
      <p className="text-4xl">🪷</p>
      <h1 className="mt-3 text-lg font-extrabold">Page not found</h1>
      <p className="mt-1 text-sm muted">That page doesn&rsquo;t exist or may have moved.</p>
      <Link href="/" className="mt-4 inline-block font-semibold" style={{ color: "#b91c1c" }}>
        ← Back to discover
      </Link>
    </div>
  );
}
