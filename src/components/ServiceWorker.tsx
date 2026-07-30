"use client";

import { useEffect } from "react";

/** Registers the service worker for offline support (production only). */
export default function ServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore registration failures */
      });
    }
  }, []);
  return null;
}
