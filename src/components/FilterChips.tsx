"use client";

import { CATEGORIES, CATEGORY_ICON, type Category } from "@/lib/types";

export default function FilterChips({
  active,
  onToggle,
}: {
  active: Set<Category>;
  onToggle: (c: Category) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
      {CATEGORIES.map((c) => {
        const on = active.has(c);
        return (
          <button
            key={c}
            onClick={() => onToggle(c)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
              on ? "text-white" : "muted"
            }`}
            style={
              on
                ? { background: "#b91c1c", borderColor: "#b91c1c" }
                : { background: "var(--surface)", borderColor: "var(--border)" }
            }
          >
            {CATEGORY_ICON[c]} {c}
          </button>
        );
      })}
    </div>
  );
}
