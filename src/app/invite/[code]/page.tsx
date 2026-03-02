"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function InvitePage() {
  const params = useParams<{ code?: string }>();
  const code = (params?.code ?? "").toString();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-black/60">Pozvánka</div>
        <h1 className="mt-1 text-2xl font-semibold">Viora invite</h1>
        <p className="mt-2 text-sm text-black/70">
          MVP stránka, aby link nepadal na 404. Neskôr tu bude prijatie pozvánky a vytvorenie priateľstva v DB.
        </p>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs font-medium text-black/60">Kód</div>
          <div className="mt-1 break-all font-mono text-base">{code || "—"}</div>
        </div>

        <div className="mt-5 flex gap-2">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5">
            Späť na Home
          </Link>
          <Link href="/friends" className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90">
            Priatelia
          </Link>
        </div>
      </div>
    </div>
  );
}