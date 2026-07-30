"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Returns null when env vars are absent so the app
 * gracefully falls back to bundled sample data (zero-config demo mode).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR_PROJECT_REF")) return null;
  return createBrowserClient(url, key);
}

export function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("YOUR_PROJECT_REF"));
}
