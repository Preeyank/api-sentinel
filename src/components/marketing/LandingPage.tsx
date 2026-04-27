"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  Shield,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────────────────── */

type UptimeSegmentStatus = "ok" | "incident" | "degraded";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Stat {
  label: string;
  value: string;
}

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const segmentReveal = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: { scaleY: 1, opacity: 1 },
};

/* ── Static data ──────────────────────────────────────────────────────────── */

const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    description:
      "30-second HTTP checks from 12 global regions. Know the moment anything goes wrong.",
  },
  {
    icon: Bell,
    title: "Instant alerting",
    description:
      "Email, Slack, PagerDuty, and webhooks. Reach your on-call team before users notice.",
  },
  {
    icon: BarChart3,
    title: "Historical analytics",
    description:
      "Response time trends, p95 latency, and SLA reporting across any date range.",
  },
  {
    icon: Globe,
    title: "Multi-region checks",
    description:
      "Verify your API is reachable globally — not just from one datacenter.",
  },
  {
    icon: Shield,
    title: "Latency thresholds",
    description:
      "Set per-monitor latency budgets. Get alerted when response time degrades, not just when it's down.",
  },
  {
    icon: Zap,
    title: "Zero-config setup",
    description:
      "Paste a URL, hit save. Your first check runs in under 30 seconds.",
  },
];

const STATS: Stat[] = [
  { label: "Check interval", value: "30s" },
  { label: "Global regions", value: "12" },
  { label: "Avg response check", value: "<120ms" },
];

// 90 segments representing ~90 days of uptime history.
// Incidents at indices 42–43; degraded performance at 71.
const UPTIME_SEGMENTS: UptimeSegmentStatus[] = Array.from(
  { length: 90 },
  (_, i): UptimeSegmentStatus => {
    if (i === 42 || i === 43) return "incident";
    if (i === 71) return "degraded";
    return "ok";
  },
);

const SEGMENT_COLOR: Record<UptimeSegmentStatus, string> = {
  ok: "bg-emerald-500/80",
  incident: "bg-destructive/80",
  degraded: "bg-amber-500/80",
};

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo variant="full" size="sm" />

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#uptime"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Reliability
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ size: "sm", className: "gap-1.5" })}
            >
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden pb-24 pt-20">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3.5 py-1.5 backdrop-blur-sm"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            All systems operational · 99.98% uptime this month
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-5xl font-bold tracking-tight leading-[1.12] md:text-6xl"
        >
          Monitor every API,
          <br />
          <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.18_230)] bg-clip-text text-transparent">
            catch every failure.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
        >
          Real-time uptime monitoring, instant incident alerts, and detailed
          latency analytics for every endpoint that matters — from one
          dashboard.
        </motion.p>

        {/* CTAs — adapt based on auth state */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={buttonVariants({
                size: "lg",
                className: "h-11 gap-2 px-7 text-sm font-semibold",
              })}
            >
              <LayoutDashboard className="size-4" />
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 px-7 text-sm font-semibold",
                })}
              >
                Start monitoring free
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "h-11 px-7 text-sm",
                })}
              >
                Sign in to dashboard
              </Link>
            </>
          )}
        </motion.div>

        {/* Stats strip */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.4 }}
          className="mt-16 grid grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-sm"
        >
          {STATS.map(({ label, value }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="flex flex-col items-center gap-1 px-6 py-5"
            >
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3.5 py-1.5">
            <Zap className="size-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Everything you need
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built for engineering teams
          </h2>
          <p className="mt-3 text-muted-foreground">
            No fluff. Just the tools you need to keep your APIs healthy.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_24px_oklch(0.47_0.21_264/0.08)]"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function UptimeBarSection() {
  return (
    <section id="uptime" className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm"
        >
          {/* Header row */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                api.example.com
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last 90 days · 99.97% uptime
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Operational
              </span>
            </div>
          </div>

          {/* Segments */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex h-8 items-stretch gap-px"
          >
            {UPTIME_SEGMENTS.map((status, i) => (
              <motion.div
                key={i}
                variants={segmentReveal}
                transition={{ duration: 0.2, delay: i * 0.008 }}
                style={{ originY: 1 }}
                className={cn(
                  "flex-1 rounded-[2px]",
                  SEGMENT_COLOR[status],
                  status === "ok" ? "opacity-80" : "opacity-100",
                )}
                title={
                  status === "ok"
                    ? "No incidents"
                    : status === "incident"
                      ? "Incident"
                      : "Degraded"
                }
              />
            ))}
          </motion.div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>90 days ago</span>
            <div className="flex items-center gap-4">
              {(
                [
                  { status: "ok", label: "No incidents" },
                  { status: "degraded", label: "Degraded" },
                  { status: "incident", label: "Incident" },
                ] as const
              ).map(({ status, label }) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-sm", SEGMENT_COLOR[status])}
                  />
                  {label}
                </span>
              ))}
            </div>
            <span>Today</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.08] to-transparent px-10 py-16 text-center"
        >
          {/* Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[80px]"
          />

          <AlertCircle className="relative mx-auto mb-4 size-10 text-primary/60" />
          <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">
            {isAuthenticated
              ? "Your dashboard is ready"
              : "Start monitoring in minutes"}
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">
            {isAuthenticated
              ? "Head back to your dashboard to manage monitors and view incidents."
              : "Add your first monitor and get alerted the moment your API goes down. No credit card required."}
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 gap-2 px-8 text-sm font-semibold",
                })}
              >
                <LayoutDashboard className="size-4" />
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className={buttonVariants({
                    size: "lg",
                    className: "h-11 px-8 text-sm font-semibold",
                  })}
                >
                  Create free account
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "h-11 px-8 text-sm",
                  })}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <Logo variant="full" size="sm" />
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} API Sentinel. All rights reserved.
        </p>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link
            href="/login"
            className="transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="transition-colors hover:text-foreground"
          >
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ── Root export ────────────────────────────────────────────────────────── */

export interface LandingPageProps {
  isAuthenticated?: boolean;
}

export function LandingPage({ isAuthenticated = false }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated} />
      <HeroSection isAuthenticated={isAuthenticated} />
      <FeaturesSection />
      <UptimeBarSection />
      <CtaSection isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
