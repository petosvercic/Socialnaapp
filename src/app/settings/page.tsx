"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getLatestCheckin, type StoredCheckin } from "@/lib/mood/storage";
import type { FeedDetail, Visibility } from "@/lib/prefs/types";
import { defaultPrefs } from "@/lib/prefs/types";
import { loadPrefs, resetPrefs, updatePrefs } from "@/lib/prefs/storage";

export default function SettingsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(defaultPrefs.visibility);
  const [detail, setDetail] = useState<FeedDetail>(defaultPrefs.detail);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [invisibleToday, setInvisibleToday] = useState<boolean>(defaultPrefs.invisibleToday);
  const [latest, setLatest] = useState<StoredCheckin | null>(null);

  useEffect(() => {
    const prefs = loadPrefs();
    setVisibility(prefs.visibility);
    setDetail(prefs.detail);
    setInvisibleToday(prefs.invisibleToday);
    setLatest(getLatestCheckin("general"));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    updatePrefs({ visibility, detail, invisibleToday });
  }, [hydrated, visibility, detail, invisibleToday]);

  useEffect(() => {
    if (!hydrated) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSyncNote("Lokálne (bez Supabase).");
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setSyncNote("Lokálne (neprihlásený).");
        return;
      }

      setSyncNote("Ukladám do účtu...");
      const vis = visibility === "public" ? "public" : visibility;

      const { error } = await supabase.from("user_prefs").upsert(
        {
          user_id: user.id,
          visibility: vis as any,
          feed_detail: detail as any,
          invisible_today: invisibleToday,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      setSyncNote(error ? `Účet: ${error.message}` : "Uložené aj do účtu ✅");
    })().catch((e) => setSyncNote(String(e?.message ?? e)));
  }, [hydrated, visibility, detail, invisibleToday]);

  const effectiveVisibility: Visibility = useMemo(() => {
    return invisibleToday ? "hidden" : visibility;
  }, [invisibleToday, visibility]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Nastavenia</h1>

      {syncNote && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{syncNote}</div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Viditeľnosť dnes</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Aby to nebolo toxické. Tvoje dáta, tvoja voľba.
        </p>

        <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <div className="font-medium">Invisible today</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Skryje ťa z feedu (bez vysvetľovania ľuďom).
            </div>
          </div>
          <input
            type="checkbox"
            checked={invisibleToday}
            onChange={(e) => setInvisibleToday(e.target.checked)}
            className="h-5 w-5 accent-zinc-950 dark:accent-white"
            aria-label="Invisible today"
          />
        </label>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { id: "public", label: "Všetci" },
            { id: "friends", label: "Priatelia" },
            { id: "hidden", label: "Skryté" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVisibility(opt.id as Visibility)}
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                effectiveVisibility === opt.id
                  ? "border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Aktuálne</div>
          <div className="mt-1">
            {effectiveVisibility === "hidden"
              ? "Skryté"
              : effectiveVisibility === "friends"
              ? "Len priatelia"
              : "Všetci"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Detail v feede</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Čo uvidia ostatní: len farbu, farbu + ikonu, alebo aj krátky text (podľa tvojho posledného check-inu).
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
              onClick={() => setDetail(opt.id as FeedDetail)}
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
            {effectiveVisibility === "hidden"
              ? "Skryté"
              : !latest
                ? "—"
                : detail === "color"
                  ? latest.result.icon
                  : detail === "icon"
                    ? `${latest.result.icon}`
                    : `${latest.result.icon} ${latest.result.status}`}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Reset</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Ak si to naklikal v hneve. Stáva sa. Ľuďom.
        </p>
        <button
          type="button"
          onClick={() => {
            const p = resetPrefs();
            setVisibility(p.visibility);
            setDetail(p.detail);
            setInvisibleToday(p.invisibleToday);
          }}
          className="mt-3 inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Resetovať nastavenia
        </button>
      </div>
    </div>
  );
}
