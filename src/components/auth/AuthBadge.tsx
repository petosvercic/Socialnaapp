"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const label = useMemo(() => {
    if (!email) return null;
    return email.length > 22 ? email.slice(0, 10) + "..." + email.slice(-10) : email;
  }, [email]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setEmail(null);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="text-xs text-black/50">...</div>;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium hover:bg-white"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        title={email}
        className="max-w-[160px] truncate rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium hover:bg-white"
      >
        {label}
      </Link>
      <button
        onClick={logout}
        className="rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90"
      >
        Logout
      </button>
    </div>
  );
}
