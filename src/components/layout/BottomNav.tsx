"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const items: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/checkin", label: "Check-in", icon: "🧭" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/history", label: "History", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/30 bg-white/35 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/35">
      <div className="mx-auto grid max-w-screen-sm grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs",
                active
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
