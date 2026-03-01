import { VioraMark } from "@/components/brand/VioraMark";

/**
 * Small, always-visible brand watermark.
 * We render it as an overlay (NOT baked into the background image),
 * so it won't disappear when the background gets cropped by `bg-cover`.
 */
export function BrandStamp() {
  return (
    <div
      className="pointer-events-none absolute bottom-20 right-4 select-none opacity-40 dark:opacity-30"
      aria-hidden
    >
      <div className="flex items-center gap-2 rounded-full bg-white/35 px-3 py-2 backdrop-blur-md dark:bg-zinc-950/25">
        <VioraMark className="h-6 w-6" />
        <div className="text-xs font-medium tracking-tight text-zinc-700 dark:text-zinc-200">
          create by <span className="font-semibold">Viora</span>
        </div>
      </div>
    </div>
  );
}
