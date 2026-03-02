# Viora

Mobile-first web app (Next.js) for daily mood check-ins that *look* smart but are actually deterministic scoring + good content.

Brand: **Viora** (lightweight mood signal for you and your friends).

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Supabase (1x setup)

Ak chceš, aby fungoval login + DB (checkins/prefs/invites/friendships):

1. Supabase Dashboard → **SQL Editor**
2. Otvor súbor `supabase/schema.sql` (v repozitári)
3. Skopíruj celý obsah → **Run**

Potom nastav env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Prečo lokál nevyzerá ako GitHub

Lokálny priečinok bude obsahovať generované adresáre ako:

- `node_modules/` (závislosti)
- `.next/` (Next.js build cache/output)

Tieto veci sa **necommitujú** (sú v `.gitignore`).
