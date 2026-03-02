"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthCallout() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEmail(null);
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading || email) return null;

  return (
    <section className="rounded-2xl border border-fuchsia-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-fuchsia-900/40 dark:bg-zinc-950/40">
      <div className="text-sm font-semibold tracking-tight">Si v demo režime</div>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
        Check-in funguje aj bez účtu. Ale bez loginu sa ti nič nesyncne a priatelia sú len kulisa.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/login"
          className="flex-1 rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Prihlásiť sa
        </Link>
        <Link
          href="/checkin"
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Pokračovať bez účtu
        </Link>
      </div>
    </section>
  );
}
