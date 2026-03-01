export default function FriendsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Priatelia</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Feed</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Placeholder: tu bude zoznam priateľov a ich dnešný semafor (bez kecov).
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Pozvať priateľa</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          MVP neskôr: invite link + referral goldy.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Skopírovať invite link
        </button>
      </div>
    </div>
  );
}
