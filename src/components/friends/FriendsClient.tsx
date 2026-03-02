"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getLatestCheckin } from "@/lib/mood/storage";
import { loadPrefs } from "@/lib/prefs/storage";
import type { FeedDetail, Visibility } from "@/lib/prefs/types";

type PingKind = "🫶" | "☕" | "👀";

const PING_KEY = "viora:pings:v1";

type DbVisibility = "public" | "friends" | "hidden";
type DbFeedDetail = "color" | "icon" | "text";

type FriendPrefs = {
  visibility: Visibility;
  detail: FeedDetail;
  invisibleToday: boolean;
};

type FriendLatest = {
  day: string;
  color: string;
  icon?: string;
  status?: string;
};

type FriendRow = {
  id: string;
  name: string;
  prefs?: FriendPrefs;
  latest?: FriendLatest;
};

function loadPings(): { at: string; to: string; kind: PingKind }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PING_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePings(pings: any[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PING_KEY, JSON.stringify(pings.slice(0, 50)));
  } catch {
    // ignore
  }
}

function dbToUiVisibility(v?: DbVisibility): Visibility {
  if (v === "public") return "public";
  if (v === "hidden") return "hidden";
  return "friends";
}

function toDayLabel(day?: string) {
  if (!day) return "—";
  return day;
}

function effectiveVisibility(p: FriendPrefs): Visibility {
  if (p.invisibleToday) return "hidden";
  return p.visibility;
}

function renderShare(detail: FeedDetail, row: { icon?: string; status?: string }) {
  if (detail === "color") return null;
  if (detail === "icon") return <span className="text-sm">{row.icon ?? "🙂"}</span>;
  return <span className="truncate text-sm font-medium">{row.status ?? "—"}</span>;
}

function colorDot(color: string) {
  const map: Record<string, string> = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    gray: "bg-zinc-400",
  };
  return map[color] ?? map.gray;
}

function card(cls?: string) {
  return `rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${cls ?? ""}`;
}

export function FriendsClient() {
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);

  const [pings, setPings] = useState(loadPings());

  const myLocalPrefs = useMemo(() => loadPrefs(), []);
  const myLatestLocal = useMemo(() => getLatestCheckin(), []);

  const inviteUrl = useMemo(() => {
    if (!inviteCode) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/invite/${inviteCode}`;
  }, [inviteCode]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setNote("Chýba Supabase konfigurácia. Skontroluj ENV vo Verceli.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setNote("Nie si prihlásený.");
        setLoading(false);
        return;
      }

      setMeId(user.id);
      setMeEmail(user.email ?? null);

      await Promise.all([loadMyInvite(supabase, user.id), loadFriends(supabase, user.id)]);
      setLoading(false);
    })().catch((e) => {
      setNote(String(e?.message ?? e));
      setLoading(false);
    });
  }, []);

  async function loadMyInvite(supabase: any, uid: string) {
    const { data, error } = await supabase
      .from("invites")
      .select("code,created_at,expires_at,revoked_at,accepted_at")
      .eq("inviter_id", uid)
      .is("revoked_at", null)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      setNote((n) => n ?? `Invite: ${error.message}`);
      setInviteCode(null);
      return;
    }

    setInviteCode(data?.[0]?.code ?? null);
  }

  async function loadFriends(supabase: any, uid: string) {
    // 1) friendships
    const { data: rels, error: relErr } = await supabase
      .from("friendships")
      .select("user1,user2,created_at")
      .or(`user1.eq.${uid},user2.eq.${uid}`);

    if (relErr) {
      setNote((n) => n ?? `Friends: ${relErr.message}`);
      setFriends([]);
      return;
    }

    const friendIds = (rels ?? [])
      .map((r: any) => (r.user1 === uid ? r.user2 : r.user1))
      .filter(Boolean) as string[];

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    // 2) profiles
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id,display_name")
      .in("id", friendIds);

    if (profErr) setNote((n) => n ?? `Profiles: ${profErr.message}`);

    // 3) prefs (visibility + detail)
    const { data: prefRows, error: prefErr } = await supabase
      .from("user_prefs")
      .select("user_id,visibility,feed_detail,invisible_today")
      .in("user_id", friendIds);

    if (prefErr) setNote((n) => n ?? `Prefs: ${prefErr.message}`);

    // 4) latest checkins (client-side reduce)
    const { data: checks, error: chkErr } = await supabase
      .from("checkins")
      .select("user_id,day,color,title,payload")
      .in("user_id", friendIds)
      .order("day", { ascending: false })
      .limit(200);

    if (chkErr) {
      // If RLS blocks some, that's OK.
      setNote((n) => n ?? `Checkins: ${chkErr.message}`);
    }

    const latestByUser = new Map<string, any>();
    for (const row of checks ?? []) {
      if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, row);
    }

    const prefsByUser = new Map<string, any>();
    for (const p of prefRows ?? []) prefsByUser.set(p.user_id, p);

    const profByUser = new Map<string, any>();
    for (const p of profs ?? []) profByUser.set(p.id, p);

    const out: FriendRow[] = friendIds.map((id) => {
      const prof = profByUser.get(id);
      const p = prefsByUser.get(id);
      const c = latestByUser.get(id);

      const uiPrefs: FriendPrefs | undefined = p
        ? {
            visibility: dbToUiVisibility(p.visibility as DbVisibility),
            detail: (p.feed_detail as DbFeedDetail) ?? "icon",
            invisibleToday: Boolean(p.invisible_today),
          }
        : undefined;

      const icon = c?.payload?.icon ?? undefined;

      return {
        id,
        name: (prof?.display_name as string) || "(bez mena)",
        prefs: uiPrefs,
        latest: c
          ? {
              day: String(c.day),
              color: String(c.color ?? "gray"),
              icon,
              status: String(c.title ?? "—"),
            }
          : undefined,
      };
    });

    setFriends(out);
  }

  function sendPing(to: string, kind: PingKind) {
    const row = { at: new Date().toISOString(), to, kind };
    const next = [row, ...pings].slice(0, 50);
    setPings(next);
    savePings(next);
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNote("Link skopírovaný ✅");
    } catch {
      setNote("Nepodarilo sa kopírovať. Skús to manuálne.");
    }
  }

  async function createInvite() {
    const supabase = getSupabaseClient();
    if (!supabase || !meId) return;

    setNote(null);

    // Prefer RPC (safer), fallback to insert (dev)
    const { data, error } = await supabase.rpc("create_invite");
    if (!error && data) {
      setInviteCode(String(data));
      return;
    }

    // fallback
    const code = String(Math.random().toString(36).slice(2, 8));
    const { error: insErr } = await supabase.from("invites").insert({ code, inviter_id: meId });
    if (insErr) {
      setNote(`Chyba: ${insErr.message}`);
      return;
    }
    setInviteCode(code);
  }

  async function revokeInvite() {
    const supabase = getSupabaseClient();
    if (!supabase || !inviteCode) return;

    setNote(null);

    const { data, error } = await supabase.rpc("revoke_invite", { p_code: inviteCode });
    if (error) {
      setNote(`Chyba: ${error.message}`);
      return;
    }

    setInviteCode(null);
    setNote("Invite zrušený.");
  }

  if (loading) {
    return <div className={card()}>Načítavam priateľov…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Priatelia</h1>
        <Link href="/settings" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">
          Nastavenia
        </Link>
      </div>

      {note && <div className={card("bg-white/70 backdrop-blur dark:bg-zinc-950/40")}>{note}</div>}

      <div className={card()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Tvoj zdieľaný stav</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Toto je náhľad toho, čo by priatelia videli podľa tvojich nastavení.
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
          <div className={`h-3 w-3 rounded-full ${colorDot(myLatestLocal?.result?.color ?? "gray")}`} aria-hidden />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {myLocalPrefs.detail !== "color" && <span className="text-sm">{myLatestLocal?.result.icon ?? "🙂"}</span>}
              {myLocalPrefs.detail === "text" ? (
                <div className="truncate text-sm font-medium">{myLatestLocal?.result.status ?? "Žiadny záznam"}</div>
              ) : (
                <div className="truncate text-sm font-medium">{myLatestLocal ? "Aktívny" : "Žiadny záznam"}</div>
              )}
            </div>
            <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">
              {myLatestLocal ? `${myLatestLocal.result.score}/100 · ${myLatestLocal.dateISO}` : "Sprav check-in, nech je čo zdieľať."}
            </div>
          </div>
        </div>
      </div>

      <div className={card()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Invite</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pošli link, druhý človek ho otvorí, prihlási sa a prijme pozvánku.
            </p>
          </div>
        </div>

        {inviteCode ? (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-950">
              {inviteUrl ?? inviteCode}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyInvite}
                className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90"
              >
                Kopírovať link
              </button>
              <Link
                href={inviteUrl ?? "#"}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Otvoriť
              </Link>
              <button
                onClick={revokeInvite}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Zrušiť invite
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <button
              onClick={createInvite}
              className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90"
            >
              Vytvoriť invite
            </button>
          </div>
        )}

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Prihlásený: <b>{meEmail ?? "—"}</b>
        </div>
      </div>

      <div className={card()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Feed</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Zobrazuje posledný check-in priateľov podľa ich nastavení (visibility/detail/invisible).
            </p>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            Zatiaľ nemáš priateľov. Pošli invite.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {friends.map((f) => {
              const p = f.prefs ?? { visibility: "friends" as Visibility, detail: "icon" as FeedDetail, invisibleToday: false };
              const eff = effectiveVisibility(p);
              const isHidden = eff === "hidden";
              const color = isHidden ? "gray" : f.latest?.color ?? "gray";
              const icon = f.latest?.icon;
              const status = f.latest?.status;

              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`h-3 w-3 shrink-0 rounded-full ${colorDot(color)}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="mt-0.5 flex min-w-0 items-center gap-2">
                        {isHidden ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">skrytý dnes</span>
                        ) : (
                          <>
                            {renderShare(p.detail, { icon, status })}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">· {toDayLabel(f.latest?.day)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "🫶")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="Poslať 🫶"
                    >
                      🫶
                    </button>
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "☕")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="Poslať ☕"
                    >
                      ☕
                    </button>
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "👀")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="Poslať 👀"
                    >
                      👀
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={card("bg-white/70 backdrop-blur dark:bg-zinc-950/40")}>
        <div className="text-sm font-medium">Pingy (lokálne)</div>
        <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
          {pings.length === 0 ? (
            <div>Žiadne pingy zatiaľ.</div>
          ) : (
            pings.slice(0, 8).map((p) => (
              <div key={p.at + p.to}>
                <span className="font-mono">{new Date(p.at).toLocaleTimeString()}</span> · {p.kind} · {p.to}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
