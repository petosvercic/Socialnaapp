"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type FriendState = {
  id: string;
  name: string;
  color: "green" | "yellow" | "orange" | "red" | "gray";
  label: string;
  updatedAt: string;
};

type PingKind = "🫶" | "☕" | "👀";

const PING_KEY = "viora:pings:v1";

function chipColor(color: FriendState["color"]) {
  switch (color) {
    case "green":
      return "bg-emerald-500";
    case "yellow":
      return "bg-yellow-400";
    case "orange":
      return "bg-orange-500";
    case "red":
      return "bg-rose-500";
    default:
      return "bg-zinc-300 dark:bg-zinc-700";
  }
}

function loadPings(): Array<{ at: string; to: string; kind: PingKind }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PING_KEY);
    return raw ? (JSON.parse(raw) as any[]) : [];
  } catch {
    return [];
  }
}

function savePings(rows: Array<{ at: string; to: string; kind: PingKind }>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PING_KEY, JSON.stringify(rows.slice(0, 25)));
  } catch {}
}

export function FriendsClient() {
  const [pings, setPings] = useState<Array<{ at: string; to: string; kind: PingKind }>>([]);

  const friends = useMemo<FriendState[]>(
    () => [
      { id: "a1", name: "Nika", color: "green", label: "v pohode", updatedAt: "dnes" },
      { id: "b2", name: "Matej", color: "yellow", label: "kolísavý mód", updatedAt: "dnes" },
      { id: "c3", name: "Zuzka", color: "orange", label: "preťažená", updatedAt: "včera" },
      { id: "d4", name: "Robo", color: "red", label: "neotravovať", updatedAt: "dnes" },
    ],
    []
  );

  useEffect(() => {
    setPings(loadPings());
  }, []);

  function sendPing(to: string, kind: PingKind) {
    const row = { at: new Date().toISOString(), to, kind };
    const next = [row, ...pings];
    setPings(next);
    savePings(next);
  }

  const inviteCode = useMemo(() => {
    // deterministic-ish code so it doesn't jump every refresh (but doesn't need to be secure in MVP)
    const base = "viora-" + (typeof window !== "undefined" ? window.location.host : "local");
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    return hash.toString(36).slice(0, 8);
  }, []);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return `/invite/${inviteCode}`;
    return `${window.location.origin}/invite/${inviteCode}`;
  }, [inviteCode]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // fallback: nothing
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Priatelia</h1>
        <Link href="/settings" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">
          Nastavenia
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Feed</div>
        <div className="mt-3 space-y-2">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${chipColor(f.color)}`} />
                <div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300">{f.label} • {f.updatedAt}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => sendPing(f.name, "🫶")} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">🫶</button>
                <button type="button" onClick={() => sendPing(f.name, "☕")} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">☕</button>
                <button type="button" onClick={() => sendPing(f.name, "👀")} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">👀</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          MVP: toto je demo feed. Neskôr: Supabase + reálne stavy + rešpektovanie viditeľnosti.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Pozvať priateľa</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Skopíruj link a pošli ho človeku, ktorý ťa má rád aj bez semaforu.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {inviteUrl}
          </code>
          <button
            type="button"
            onClick={copyInvite}
            className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Kopírovať
          </button>
        </div>
      </div>

      {pings.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium">Posledné pingy</div>
          <div className="mt-3 space-y-1">
            {pings.slice(0, 10).map((p, idx) => (
              <div key={idx} className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-2">{p.kind}</span>
                <span className="font-medium">{p.to}</span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{new Date(p.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
