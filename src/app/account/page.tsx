"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setNote("Chýba Supabase ENV. Nastav .env.local a Vercel env vars.");
      setEmail(null);
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) setNote(error.message);
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function logout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-black/60">Účet</div>
        <h1 className="mt-1 text-2xl font-semibold">Status</h1>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm">
          {email ? (
            <>Prihlásený ako: <b>{email}</b></>
          ) : (
            <>Neprihlásený</>
          )}
        </div>

        {note && (
          <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm">
            {note}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-center text-sm font-medium hover:bg-black/5"
          >
            Login
          </Link>
          <button
            onClick={logout}
            className="flex-1 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          >
            Logout
          </button>
        </div>

        <div className="pt-3 text-sm text-black/60">
          <Link className="underline" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}