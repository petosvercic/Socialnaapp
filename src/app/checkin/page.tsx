import { CheckinClient } from "@/components/mood/CheckinClient";

export default function CheckinPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Denný check-in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          5 otázok, 1 výsledok. MVP verzia beží na sample obsahu.
        </p>
      </div>

      <CheckinClient />
    </div>
  );
}
