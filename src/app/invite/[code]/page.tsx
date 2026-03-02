"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const params = useParams<{ code?: string }>();
  const router = useRouter();
  const code = (params?.code ?? "").toString().trim().toLowerCase();

  const [meId, setMeId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Chýba Supabase ENV. Invite funguje len keď je Supabase nastavený.");
      setChecking(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setMeId(data.user?.id ?? null);
      setChecking(false);
    });
  }, []);

  async function accept() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setStatus(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setStatus("Najprv sa prihlás.");
      router.push("/login");
      return;
    }

    setStatus("Prijímam pozvánku...");

    const { data: updated, error: updErr } = await supabase
      .from("invites")
      .update({ invitee_id: user.id, accepted_at: new Date().toISOString() })
      .eq("code", code)
      .is("accepted_at", null)
      .is("invitee_id", null)
      .select("inviter_id")
      .limit(1);

    if (updErr) {
      setStatus(`Chyba: ${updErr.message}`);
      return;
    }

    const inviterId = (updated?.[0] as any)?.inviter_id as string | undefined;
    if (!inviterId) {
      setStatus("Pozvánka je neplatná alebo už použitá.");
      return;
    }

    const { error: frErr } = await supabase.from("friendships").insert({ user_a: inviterId, user_b: user.id });
    if (frErr) {
      setStatus(`Chyba: ${frErr.message}`);
      return;
    }

    setStatus("Hotovo ✅ Ste priatelia.");
    router.push("/friends");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-black/60">Pozvánka</div>
        <h1 className="mt-1 text-2xl font-semibold">Viora invite</h1>
        <p className="mt-2 text-sm text-black/70">
          Otvoril si link s kódom. Ak si prihlásený, môžeš pozvánku prijať a vytvorí sa priateľstvo.
        </p>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs font-medium text-black/60">Kód</div>
          <div className="mt-1 break-all font-mono text-base">{code || "—"}</div>
        </div>

        {status && <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm">{status}</div>}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Späť na Home
          </Link>

          {!checking && !meId ? (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            >
              Prihlásiť sa
            </Link>
          ) : (
            <button
              type="button"
              onClick={accept}
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
              disabled={!code}
            >
              Prijať pozvánku
            </button>
          )}

          <Link
            href="/friends"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Priatelia
          </Link>
        </div>
      </div>
    </div>
  );
}
