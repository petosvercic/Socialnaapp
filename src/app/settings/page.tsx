"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [visibility, setVisibility] = useState<"everyone" | "friends" | "hidden">("friends");
  const [detail, setDetail] = useState<"color" | "icon" | "text">("icon");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Nastavenia</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Viditeľnosť dnes</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Aby to nebolo toxické. Tvoje dáta, tvoja voľba.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { id: "everyone", label: "Všetci" },
            { id: "friends", label: "Priatelia" },
            { id: "hidden", label: "Skryté" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVisibility(opt.id as any)}
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                visibility === opt.id
                  ? "border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Detail v feede</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Čo uvidia ostatní: len farbu, farbu + ikonu, alebo aj krátky text.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { id: "color", label: "Farba" },
            { id: "icon", label: "Ikona" },
            { id: "text", label: "Text" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDetail(opt.id as any)}
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                detail === opt.id
                  ? "border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Náhľad</div>
          <div className="mt-1">
            {detail === "color" ? "🟡" : detail === "icon" ? "🟡 🧭" : "🟡 Kolísavý mód"}
          </div>
        </div>
      </div>
    </div>
  );
}
