"use client";

import { useMemo, useState } from "react";
import { clearCheckins, deleteCheckin, loadCheckins } from "@/lib/mood/storage";

const colorClass: Record<string, string> = {
  green: "bg-green-400",
  yellow: "bg-yellow-300",
  orange: "bg-orange-400",
  red: "bg-red-500",
};

function fmtDate(iso: string) {
  // MVP: keep ISO (it's already readable)
  return iso;
}

export function HistoryClient() {
  const [tick, setTick] = useState(0);

  const items = useMemo(() => {
    void tick; // re-evaluate after mutations
    return loadCheckins();
  }, [tick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">
          {items.length ? `Záznamy (${items.length})` : "Zatiaľ žiadna história"}
        </div>

        <button
          type="button"
          onClick={() => {
            clearCheckins();
            setTick((x) => x + 1);
          }}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Vymazať všetko
        </button>
      </div>

      <div className="space-y-2">
        {items.map((x) => (
          <div
            key={x.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-1 h-5 w-5 rounded-full border border-zinc-900/15 dark:border-white/15",
                  colorClass[x.result.color] ?? "bg-zinc-300",
                ].join(" ")}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">
                  {x.result.status} <span className="text-xs font-medium text-zinc-500">({x.result.score}/100)</span>
                </div>
                <div className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                  {x.result.tip}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {fmtDate(x.dateISO)} • {x.result.category}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                deleteCheckin(x.id);
                setTick((t) => t + 1);
              }}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Zmazať
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
