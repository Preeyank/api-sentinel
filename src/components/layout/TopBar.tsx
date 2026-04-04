"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PAGE_TITLES } from "@/lib/constants/nav";

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between px-6">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <ThemeToggle />
    </header>
  );
}
