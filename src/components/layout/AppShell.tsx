import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { VioraMark } from "@/components/brand/VioraMark";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { AuthBadge } from "@/components/auth/AuthBadge";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-zinc-950 dark:text-zinc-50">
      {/* Brand background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/brand/viora-bg.webp')] bg-contain bg-center bg-no-repeat opacity-55 saturate-150 contrast-125 dark:opacity-30"
        aria-hidden
      />
      {/* Chroma wash (keeps the background alive, without killing readability) */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10"
        aria-hidden
      />
      {/* Readability overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/60 dark:from-zinc-950/80 dark:via-zinc-950/55 dark:to-zinc-950/85"
        aria-hidden
      />
      {/* Tiny dark scrim: makes light backgrounds less "washed out" */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/10 dark:bg-black/25"
        aria-hidden
      />

      <div className="relative min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-white/30 bg-white/35 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/35">
          <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label="Viora"
            >
              <VioraMark className="h-6 w-6" />
              <span>Viora</span>
            </Link>
            <div className="flex items-center gap-3">
              <AuthBadge />
              <div className="text-xs text-zinc-600 dark:text-zinc-300">MVP</div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-4">
          {children}
        </main>

        <BrandStamp />

        <BottomNav />
      </div>
    </div>
  );
}
