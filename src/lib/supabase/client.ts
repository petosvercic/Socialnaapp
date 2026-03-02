import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ak ENV chýba, build nespadne. Len supabase nebude dostupný.
  if (!url || !anon) return null;

  return createClient(url, anon);
}