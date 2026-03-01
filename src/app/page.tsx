import Link from "next/link";
import { LastStateCard } from "@/components/mood/LastStateCard";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dnes</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Rýchly check-in. 5 otázok. Jedna karta. Žiadne dramatické AI.
            </p>
          </div>
          <div className="text-3xl" aria-hidden>
            🧠
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href="/checkin"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Spustiť check-in
          </Link>
          <Link
            href="/friends"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Pozrieť priateľov
          </Link>
        </div>
      </section>

      <LastStateCard />

      <section className="grid grid-cols-2 gap-4">
        <Link
          href="/history"
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-2xl" aria-hidden>
            📊
          </div>
          <div className="mt-2 text-sm font-semibold">História</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Trendy a streaky (neskôr).
          </div>
        </Link>

        <Link
          href="/settings"
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-2xl" aria-hidden>
            ⚙️
          </div>
          <div className="mt-2 text-sm font-semibold">Nastavenia</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Súkromie a viditeľnosť.
          </div>
        </Link>
      </section>
    </div>
  );
}
