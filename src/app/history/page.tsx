export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">História</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Posledných 7 dní</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Placeholder: tu bude jednoduchý trend (bez grafového cirkusu).
        </p>

        <div className="mt-3 space-y-2">
          {[
            { d: "Dnes", c: "🟡", t: "Kolísavý mód" },
            { d: "Včera", c: "🟠", t: "Napätý mód" },
            { d: "Predvčerom", c: "🟢", t: "Stabilný mód" },
          ].map((row) => (
            <div
              key={row.d}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {row.c}
                </span>
                <span className="font-medium">{row.d}</span>
              </div>
              <span className="text-zinc-600 dark:text-zinc-300">{row.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
