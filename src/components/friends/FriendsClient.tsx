"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getLatestCheckin, localDateISO } from "@/lib/mood/storage";
import { loadPrefs } from "@/lib/prefs/storage";
import type { FeedDetail, Prefs, Visibility } from "@/lib/prefs/types";

type PingKind = "Ä‘ĹşÂ«Â¶" | "Ă˘Ââ€˘" | "Ä‘Ĺşâ€â‚¬";

const PING_KEY = "viora:pings:v1";

const colorDot: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-rose-500",
  gray: "bg-zinc-300 dark:bg-zinc-700",
};

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

function effectiveVisibility(p: Pick<Prefs, "visibility" | "invisibleToday">): Visibility {
  return p.invisibleToday ? "hidden" : p.visibility;
}

function renderShare(detail: FeedDetail, share: { icon?: string; status?: string }) {
  if (detail === "color") return null;
  if (detail === "icon") return <span className="text-sm">{share.icon ?? "Ă˘ĹˇĹž"}</span>;
  return (
    <span className="truncate text-sm text-zinc-700 dark:text-zinc-200">
      {share.icon ?? "Ă˘ĹˇĹž"} <span className="font-medium">{share.status ?? "Ă˘â‚¬â€ť"}</span>
    </span>
  );
}

type DbVisibility = "public" | "friends" | "hidden";

function uiToDbVisibility(v: Visibility): DbVisibility {
  return v === "everyone" ? "public" : v;
}

function dbToUiVisibility(v: DbVisibility): Visibility {
  return v === "public" ? "everyone" : v;
}

function toDayLabel(dayISO?: string) {
  if (!dayISO) return "Ă˘â‚¬â€ť";
  const today = localDateISO(new Date());
  if (dayISO === today) return "dnes";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dayISO === localDateISO(y)) return "vĂ„Ĺ¤era";
  return dayISO;
}

function generateCode() {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz"; // no confusing chars
  let out = "";
  const n = 8;
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

type FriendRow = {
  id: string;
  name: string;
  prefs?: { visibility: Visibility; detail: FeedDetail; invisibleToday: boolean };
  latest?: { day: string; color: string; icon?: string; status?: string };
};

export function FriendsClient() {
  const router = useRouter();

  const [pings, setPings] = useState<Array<{ at: string; to: string; kind: PingKind }>>([]);
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [acceptCode, setAcceptCode] = useState<string>("");

  const [friends, setFriends] = useState<FriendRow[]>([]);

  const inviteUrl = useMemo(() => {
    if (!inviteCode) return null;
    if (typeof window === "undefined") return `/invite/${inviteCode}`;
    return `${window.location.origin}/invite/${inviteCode}`;
  }, [inviteCode]);

  const myLatest = useMemo(() => getLatestCheckin("general"), []);
  const myEffective = prefs ? effectiveVisibility(prefs) : "friends";

  useEffect(() => {
    setPings(loadPings());
    setPrefs(loadPrefs());

    const supabase = getSupabaseClient()!;
    if (!supabase) {
      setNote("ChÄ‚Ëťba Supabase ENV. Friends reÄąÄľim potrebuje Supabase.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setNote("Nie si prihlÄ‚Ë‡senÄ‚Ëť.");
        setLoading(false);
        return;
      }
      setMeId(user.id);

      await Promise.all([loadInvite(user.id), loadFriends(user.id)]);
      setLoading(false);
    })().catch((e) => {
      setNote(String(e?.message ?? e));
      setLoading(false);
    });

    async function loadInvite(uid: string) {
      const { data, error } = await supabase!
        .from("invites")
        .select("code,created_at")
        .eq("inviter_id", uid)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        setNote(`Invite: ${error.message}`);
        return;
      }
      setInviteCode(data?.[0]?.code ?? null);
    }

    async function loadFriends(uid: string) {
      // 1) friendships
      const { data: rels, error: relErr } = await supabase
        .from("friendships")
        .select("user_a,user_b,created_at")
        .or(`user_a.eq.${uid},user_b.eq.${uid}`);

      if (relErr) {
        setNote(`Friends: ${relErr.message}`);
        setFriends([]);
        return;
      }

      const friendIds = (rels ?? [])
        .map((r: any) => (r.user_a === uid ? r.user_b : r.user_a))
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

      if (profErr) {
        setNote(`Profiles: ${profErr.message}`);
      }

      // 3) prefs (visibility + detail)
      const { data: prefRows, error: prefErr } = await supabase
        .from("user_prefs")
        .select("user_id,visibility,feed_detail,invisible_today")
        .in("user_id", friendIds);

      if (prefErr) {
        setNote(`Prefs: ${prefErr.message}`);
      }

      // 4) latest checkins (client-side reduce)
      const { data: checks, error: chkErr } = await supabase
        .from("checkins")
        .select("user_id,day,color,title,payload")
        .in("user_id", friendIds)
        .order("day", { ascending: false })
        .limit(200);

      if (chkErr) {
        // If RLS blocks some, that's OK. We'll show them as hidden/no data.
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

        const uiPrefs = p
          ? {
              visibility: dbToUiVisibility(p.visibility as DbVisibility),
              detail: (p.feed_detail as FeedDetail) ?? "icon",
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
                status: String(c.title ?? "Ă˘â‚¬â€ť"),
              }
            : undefined,
        };
      });

      setFriends(out);
    }
  }, []);

  function sendPing(to: string, kind: PingKind) {
    const row = { at: new Date().toISOString(), to, kind };
    const next = [row, ...pings];
    setPings(next);
    savePings(next);
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNote("Link skopÄ‚Â­rovanÄ‚Ëť Ă˘Ĺ›â€¦");
    } catch {
      setNote("Nepodarilo sa kopÄ‚Â­rovaÄąÄ„ (skÄ‚Ĺźs manuÄ‚Ë‡lne). ");
    }
  }

  async function createInvite() {
    const supabase = getSupabaseClient()!;
    if (!supabase || !meId) return;

    setNote(null);
    const code = generateCode();

    const { error } = await supabase.from("invites").insert({ code, inviter_id: meId });
    if (error) {
      setNote(`Invite: ${error.message}`);
      return;
    }
    setInviteCode(code);
    setNote("Invite vytvorenÄ‚Ëť Ă˘Ĺ›â€¦");
  }

  async function acceptInvite() {
    const supabase = getSupabaseClient()!;
    if (!supabase || !meId) return;

    const code = acceptCode.trim().toLowerCase();
    if (!code) return;

    setNote(null);

    const { data: updated, error: updErr } = await supabase!
      .from("invites")
      .update({ invitee_id: meId, accepted_at: new Date().toISOString() })
      .eq("code", code)
      .is("accepted_at", null)
      .is("invitee_id", null)
      .select("inviter_id,code")
      .limit(1);

    if (updErr) {
      setNote(`Accept: ${updErr.message}`);
      return;
    }

    const inviterId = (updated?.[0] as any)?.inviter_id as string | undefined;
    if (!inviterId) {
      setNote("KÄ‚Ĺ‚d je neplatnÄ‚Ëť alebo uÄąÄľ pouÄąÄľitÄ‚Ëť.");
      return;
    }

    const { error: frErr } = await supabase.from("friendships").insert({ user_a: inviterId, user_b: meId });
    if (frErr) {
      setNote(`Friendship: ${frErr.message}`);
      return;
    }

    setAcceptCode("");
    setNote("PridanÄ‚Â© medzi priateĂ„Äľov Ă˘Ĺ›â€¦");

    // refresh
    setLoading(true);
    const uid = meId;
    const { data: rels } = await supabase
      .from("friendships")
      .select("user_a,user_b")
      .or(`user_a.eq.${uid},user_b.eq.${uid}`);

    const friendIds = (rels ?? [])
      .map((r: any) => (r.user_a === uid ? r.user_b : r.user_a))
      .filter(Boolean) as string[];

    if (friendIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", friendIds);
    const profByUser = new Map<string, any>();
    for (const p of profs ?? []) profByUser.set(p.id, p);

    setFriends(friendIds.map((id) => ({ id, name: profByUser.get(id)?.display_name ?? "(bez mena)" })));
    setLoading(false);

    // Optional: go to friends list top
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">NaĂ„Ĺ¤Ä‚Â­tavam priateĂ„Äľov...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Priatelia</h1>
        <Link href="/settings" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">
          Nastavenia
        </Link>
      </div>

      {note && (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-3 text-sm shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
          {note}
        </div>
      )}

      {prefs && myEffective === "hidden" && (
        <div className="rounded-2xl border border-fuchsia-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-fuchsia-900/40 dark:bg-zinc-950/40">
          <div className="text-sm font-medium">Si skrytÄ‚Ëť dnes</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Tvoje meno sa v feede neukÄ‚Ë‡ÄąÄľe. Ă„Ëťudia budÄ‚Ĺź musieÄąÄ„ ÄąÄľiÄąÄ„ s neistotou. StraÄąË‡nÄ‚Â©.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Tvoj zdieĂ„ÄľanÄ‚Ëť stav</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              NÄ‚Ë‡hĂ„Äľad podĂ„Äľa tvojich nastavenÄ‚Â­. SkutoĂ„Ĺ¤nÄ‚Â© zdieĂ„Äľanie riadi DB (user_prefs).
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
              "h-3 w-3 rounded-full",
              myEffective === "hidden" ? colorDot.gray : colorDot[myLatest?.result?.color ?? "gray"],
            ].join(" ")}
            aria-hidden
          />
          <div className="min-w-0">
            {myEffective === "hidden" ? (
              <div className="text-sm font-medium">SkrytÄ‚Â©</div>
            ) : prefs ? (
              <div className="flex items-center gap-2">
                {prefs.detail !== "color" && <span className="text-sm">{myLatest?.result.icon ?? "Ă˘ĹˇĹž"}</span>}
                {prefs.detail === "text" ? (
                  <div className="truncate text-sm font-medium">{myLatest?.result.status ?? "ÄąËťiadny zÄ‚Ë‡znam"}</div>
                ) : (
                  <div className="truncate text-sm font-medium">{myLatest ? "AktÄ‚Â­vny" : "ÄąËťiadny zÄ‚Ë‡znam"}</div>
                )}
              </div>
            ) : (
              <div className="text-sm font-medium">Ă˘â‚¬Â¦</div>
            )}
            <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">
              {myLatest ? `${myLatest.result.score}/100 Ă˘â‚¬Ë ${myLatest.dateISO}` : "Sprav check-in, nech je Ă„Ĺ¤o zdieĂ„ÄľaÄąÄ„."}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Feed</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Zobrazuje poslednÄ‚Ëť check-in priateĂ„Äľov podĂ„Äľa ich nastavenÄ‚Â­ (visibility/detail/invisible).
            </p>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            ZatiaĂ„Äľ nemÄ‚Ë‡ÄąË‡ priateĂ„Äľov. SmutnÄ‚Â©, ale opraviteĂ„ÄľnÄ‚Â©: poÄąË‡li invite.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {friends.map((f) => {
              const p = f.prefs ?? { visibility: "friends" as Visibility, detail: "icon" as FeedDetail, invisibleToday: false };
              const eff = effectiveVisibility({ visibility: p.visibility, invisibleToday: p.invisibleToday });
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
                    <div className={`h-3 w-3 shrink-0 rounded-full ${colorDot[color] ?? colorDot.gray}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="mt-0.5 flex min-w-0 items-center gap-2">
                        {isHidden ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">skrytÄ‚Â©</span>
                        ) : (
                          <>
                            {renderShare(p.detail, { icon, status })}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Ă˘â‚¬Ë {toDayLabel(f.latest?.day)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "Ä‘ĹşÂ«Â¶")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="PoslaÄąÄ„ Ä‘ĹşÂ«Â¶"
                    >
                      Ä‘ĹşÂ«Â¶
                    </button>
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "Ă˘Ââ€˘")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="PoslaÄąÄ„ Ă˘Ââ€˘"
                    >
                      Ă˘Ââ€˘
                    </button>
                    <button
                      type="button"
                      onClick={() => sendPing(f.name, "Ä‘Ĺşâ€â‚¬")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      aria-label="PoslaÄąÄ„ Ä‘Ĺşâ€â‚¬"
                    >
                      Ä‘Ĺşâ€â‚¬
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">PozvaÄąÄ„ priateĂ„Äľa</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Invite link je uloÄąÄľenÄ‚Ëť v DB. Jeden klik a zdieĂ„ÄľaÄąË‡.</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {inviteUrl ?? "(zatiaĂ„Äľ nemÄ‚Ë‡ÄąË‡ invite)"}
          </code>

          {inviteCode ? (
            <Link
              href={`/invite/${inviteCode}`}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              OtvoriÄąÄ„
            </Link>
          ) : (
            <button
              type="button"
              onClick={createInvite}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              VytvoriÄąÄ„ invite
            </button>
          )}

          <button
            type="button"
            onClick={inviteCode ? copyInvite : createInvite}
            className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {inviteCode ? "KopÄ‚Â­rovaÄąÄ„" : "VytvoriÄąÄ„ + kopÄ‚Â­rovaÄąÄ„"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium">PrijaÄąÄ„ pozvÄ‚Ë‡nku</div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">MÄ‚Ë‡ÄąË‡ kÄ‚Ĺ‚d? Sem s nÄ‚Â­m. Potom to bude obojstrannÄ‚Â©.</p>
          <div className="mt-2 flex gap-2">
            <input
              value={acceptCode}
              onChange={(e) => setAcceptCode(e.target.value)}
              placeholder="napr. 8znakov"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={acceptInvite}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              PridaÄąÄ„
            </button>
          </div>
        </div>
      </div>

      {pings.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium">PoslednÄ‚Â© pingy</div>
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

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Pozn.: Ak v Supabase eÄąË‡te nemÄ‚Ë‡ÄąË‡ spustenÄ‚Â© migrÄ‚Ë‡cie, sprav to. Inak DB feed nebude maÄąÄ„ Ă„Ĺ¤o Ă„Ĺ¤Ä‚Â­taÄąÄ„.
      </div>
    </div>
  );
}
