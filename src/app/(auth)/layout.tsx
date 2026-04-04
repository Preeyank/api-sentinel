import {
  ShieldCheck,
  Activity,
  Bell,
  BarChart3,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const FEATURES = [
  {
    icon: Activity,
    label: "Real-time uptime monitoring",
    sub: "30-second checks from 12 global regions",
  },
  {
    icon: Bell,
    label: "Instant incident alerts",
    sub: "Email, Slack, PagerDuty and webhooks",
  },
  {
    icon: BarChart3,
    label: "Historical analytics",
    sub: "Response time trends and SLA reporting",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Base */}
        <div className="absolute inset-0 bg-[oklch(0.12_0.04_264)]" />
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.3_0.17_264)] via-[oklch(0.17_0.07_264)] to-[oklch(0.1_0.03_264)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_-5%_-5%,oklch(0.55_0.22_270/0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_105%_105%,oklch(0.45_0.18_230/0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_35%_at_65%_25%,oklch(0.6_0.24_264/0.12),transparent)]" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/0.065)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_110%_at_50%_50%,transparent_55%,oklch(0_0_0/0.45))]" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-[0_0_24px_oklch(0.6_0.25_264/0.45)]">
              <ShieldCheck className="size-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              API Sentinel
            </span>
          </div>
          {/* Live badge */}
          <div className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/12 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-white/75">
              All systems operational
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-10">
          {/* Label + headline */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 ring-1 ring-white/12 backdrop-blur-sm">
              <Zap className="size-3 text-[oklch(0.78_0.16_264)]" />
              <span className="text-xs font-medium text-white/65 tracking-widest uppercase">
                API Monitoring Platform
              </span>
            </div>
            <h1 className="text-[2.5rem] font-bold tracking-tight leading-[1.15] text-white">
              Monitor every API,
              <br />
              <span className="bg-gradient-to-r from-[oklch(0.72_0.18_264)] to-[oklch(0.82_0.14_230)] bg-clip-text text-transparent">
                catch every failure.
              </span>
            </h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Real-time uptime monitoring, instant alerting, and detailed
              analytics for all your critical endpoints — from one dashboard.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-start gap-4">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.47_0.21_264/0.28)] ring-1 ring-[oklch(0.65_0.18_264/0.3)]">
                  <Icon className="size-5 text-[oklch(0.78_0.16_264)]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white/90">
                    {label}
                  </p>
                  <p className="text-sm text-white/45 mt-1">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-white/22">
            © {new Date().getFullYear()} API Sentinel. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 flex-col relative">
        {/* Subtle dot grid — light only */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,oklch(0.5_0.12_264/0.07)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[radial-gradient(circle,oklch(1_0_0/0.03)_1px,transparent_1px)]" />
        {/* Pulsing glow behind the form card — always visible regardless of     */}
        {/* viewport width since this panel is never hidden.                      */}
        <div
          aria-hidden="true"
          style={{ animation: "auth-glow-pulse 4s ease-in-out infinite" }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary blur-3xl"
        />

        <div className="relative flex items-center justify-between p-4 pl-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              API Sentinel
            </span>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
