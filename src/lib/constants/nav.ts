import { LayoutDashboard, Activity, KeyRound } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/monitors", icon: Activity, label: "Monitors" },
  { href: "/dashboard/sessions", icon: KeyRound, label: "Sessions" },
] as const;

// Pages that have titles but are not primary nav items (accessed via dropdown etc.)
const EXTRA_PAGES = [
  { href: "/dashboard/profile", label: "Profile" },
] as const;

export const PAGE_TITLES: Record<string, string> = Object.fromEntries([
  ...NAV_ITEMS.map((item) => [item.href, item.label]),
  ...EXTRA_PAGES.map((item) => [item.href, item.label]),
]);
