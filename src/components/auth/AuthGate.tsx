"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

export function AuthGate({
  title = "Táto časť potrebuje účet",
  description = "Priatelia, pozvánky a sync dávajú zmysel len keď vieme, kto si.",
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
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

  if (loading) {
    return (
      <Card>
        <div className="text-sm font-medium">Načítavam...</div>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{description}</p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Prihlásiť / Registrovať
          </Link>
          <Link
            href="/checkin"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Pokračovať v check-ine
          </Link>
        </div>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Check-in môžeš robiť aj bez účtu. Účet je na sync a sociálne veci.
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
