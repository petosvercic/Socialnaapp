"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMsg(error ? error.message : "Prihlásenie OK ✅");
  }

  async function signUp() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMsg(error ? error.message : "Registrácia OK ✅ (pozri email, ak máš zapnuté potvrdenie)");
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-black/60">Účet</div>
        <h1 className="mt-1 text-2xl font-semibold">Prihlásenie</h1>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="heslo"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={signIn}
              className="flex-1 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              Prihlásiť
            </button>
            <button
              disabled={busy}
              onClick={signUp}
              className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
            >
              Registrovať
            </button>
          </div>

          {msg && <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">{msg}</div>}

          <div className="pt-2 text-sm text-black/60">
            <Link className="underline" href="/account">Účet (status)</Link>
            {" · "}
            <Link className="underline" href="/">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}