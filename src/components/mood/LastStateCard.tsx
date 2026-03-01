"use client";

import Link from "next/link";
import { getLatestCheckin } from "@/lib/mood/storage";

const colorClass: Record<string, string> = {
  green: "bg-green-400",
  yellow: "bg-yellow-300",
  orange: "bg-orange-400",
  red: "bg-red-500",
};

export function LastStateCard() {
  const latest = getLatestCheckin("general");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Tvoj posledný stav</h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            {latest ? "Uložené lokálne (MVP)." : "Zatiaľ nič. Sprav dnešný check-in."}
          </p>
        </div>

        <Link
          href="/checkin"
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Check-in
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className={[
            "h-6 w-6 rounded-full border border-zinc-900/15 dark:border-white/15",
            latest ? (colorClass[latest.result.color] ?? "bg-zinc-300") : "bg-zinc-200",
          ].join(" ")}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {latest ? latest.result.status : "Žiadny záznam"}
          </div>
          <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">
            {latest ? `${latest.result.score}/100 • ${latest.dateISO}` : "Klikni a vyplň 5 otázok."}
          </div>
        </div>
      </div>
    </section>
  );
}
