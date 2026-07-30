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
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
        .catch(() => {
          /* ignore registration failures */
        });
    }
  }, []);
  return null;
}
