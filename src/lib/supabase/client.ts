import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // nech je hneď jasné, prečo to “nič nerobí”
  // (na Verceli sa toto zobrazí v logoch pri renderi klient stránok)
  console.warn("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(url ?? "", anon ?? "");