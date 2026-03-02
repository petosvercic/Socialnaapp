"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const params = useParams<{ code?: string }>();
  const router = useRouter();

  const code = useMemo(() => (params?.code ?? "").toString().trim().toLowerCase(), [params]);

  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Chýba Supabase konfigurácia. Skontroluj ENV vo Verceli.");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setMeEmail(data.user?.email ?? null);
    });
  }, []);

  async function accept() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setBusy(true);
    setStatus(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setBusy(false);
      setStatus("Najprv sa prihlás.");
      router.push(`/login`);
      return;
    }

    try {
      setStatus("Prijímam pozvánku…");

      const { data: inviterId, error } = await supabase.rpc("accept_invite", { p_code: code });

      if (error) {
        setBusy(false);
        setStatus(`Chyba: ${error.message}`);
        return;
      }

      setBusy(false);
      setStatus("Hotovo ✅ Už ste priatelia.");
      router.push("/friends");
    } catch (e: any) {
      setBusy(false);
      setStatus(`Chyba: ${String(e?.message ?? e)}`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-black/60">Pozvánka</div>
        <h1 className="mt-1 text-2xl font-semibold">Viora invite</h1>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs font-medium text-black/60">Kód</div>
          <div className="mt-1 break-all font-mono text-base">{code || "—"}</div>
        </div>

        <div className="mt-4 text-sm text-black/70">
          {meEmail ? (
            <>
              Prihlásený ako <b>{meEmail}</b>. Môžeš prijať pozvánku.
            </>
          ) : (
            <>
              Nie si prihlásený. Najprv sa prihlás, potom prijmi pozvánku.
            </>
          )}
        </div>

        {status && (
          <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm">{status}</div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={busy || !code}
            onClick={accept}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
          >
            Prijať pozvánku
          </button>

          <Link
            href="/friends"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Priatelia
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Home
          </Link>
        </div>

        <div className="mt-4 text-xs text-black/50">
          Pozn.: Ak ti to vypíše, že RPC neexistuje, ešte si nespustil migráciu <code>viora_social.sql</code>.
        </div>
      </div>
    </div>
  );
}
