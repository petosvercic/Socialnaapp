import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            Socialnaapp
          </Link>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">MVP build</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
