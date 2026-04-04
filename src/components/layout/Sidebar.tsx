"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
} from "lucide-react";
import { cn, getInitials, formatPlanLabel } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NAV_ITEMS } from "@/lib/constants/nav";

type SidebarProps = {
  user: { name: string; email: string };
  plan: string;
};

export function Sidebar({ user, plan }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  function toggle() {
    setCollapsed((v) => !v);
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  }

  const planLabel = formatPlanLabel(plan);

  return (
    <aside
      className={cn(
        "relative hidden h-full shrink-0 flex-col border-r bg-sidebar md:flex overflow-visible transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-60",
      )}
    >
      {/* Decorative top glow — visible in both modes, more prominent in dark */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.06] to-transparent" aria-hidden="true" />

      {/* Header: logo/title (hides when collapsed) + always-visible toggle */}
      <div className="flex h-10 shrink-0 items-center px-2 mt-1.5">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 transition-all duration-200",
            collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100",
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 shadow-sm ring-2 ring-primary/30">
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-sidebar-foreground">
            API Sentinel
          </span>
        </div>
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-hidden p-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/10 text-primary ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {active && (
                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary" />
              )}
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* User footer with dropdown */}
      <div ref={menuRef} className="relative border-t">
        {menuOpen && (
          <div className="absolute bottom-full left-0 z-50 mb-1 w-52 overflow-hidden rounded-xl border bg-popover shadow-lg ring-1 ring-border">
            <div className="p-1.5">
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <User className="size-3.5 text-muted-foreground" />
                Profile
              </Link>
            </div>
            <div className="border-t p-1.5">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={collapsed ? user.name : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-3 transition-colors hover:bg-accent",
            collapsed && "justify-center",
          )}
        >
          <Avatar size="sm" className="ring-1 ring-primary/25">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {user.name}
              </p>
              <p className="text-[10px] text-primary/70">{planLabel} plan</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
