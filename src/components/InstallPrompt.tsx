"use client";

import { useEffect, useState } from "react";

/** Add-to-Home-Screen prompt. Uses the beforeinstallprompt event where available. */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;

  async function install() {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setDismissed(true);
    } else {
      alert("On your phone: tap the Share button, then “Add to Home Screen”.");
    }
  }

  return (
    <div
      className="mx-4 mt-3 flex items-center gap-3 rounded-2xl p-3.5 text-white shadow-soft"
      style={{ background: "linear-gradient(135deg,#b91c1c,#f97316)" }}
    >
      <span className="text-2xl">📲</span>
      <p className="flex-1 text-[13px] font-semibold leading-snug">
        Add HeritageHub to your home screen — works offline at crowded venues.
      </p>
      <button onClick={install} className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[13px] font-extrabold" style={{ color: "#b91c1c" }}>
        Install
      </button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="px-1 text-lg">
        ×
      </button>
    </div>
  );
}
