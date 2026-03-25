"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/monitors": "Monitors",
  "/dashboard/sessions": "Sessions",
  "/dashboard/profile": "Profile",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <ThemeToggle />
    </header>
  );
}
