"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Activity,
  Play,
  Search,
  Pause,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MonitorDialog } from "@/components/monitors/MonitorDialog";
import { MonitorStatusBadge } from "@/components/monitors/MonitorStatusBadge";
import { deleteMonitor, toggleMonitor } from "@/lib/actions/monitors";
import {
  ENV_LABELS,
  ENV_BADGE_CLASSES,
  ERROR_LABELS,
} from "@/lib/constants/monitors";
import { cn, formatInterval, timeAgo } from "@/lib/utils";
import type { CheckOutcome } from "@/types/checks";
import type { Monitor, MonitorWithStats } from "@/types/monitors";

type Props = {
  monitors: MonitorWithStats[];
};

function StatusDot({ status }: { status: MonitorWithStats["status"] }) {
  if (status === "UP") {
    return (
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-success animate-pulse-glow" />
      </span>
    );
  }
  if (status === "DOWN") {
    return <span className="size-2.5 shrink-0 rounded-full bg-destructive" />;
  }
  return (
    <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
  );
}

function UptimeHistory({
  segments,
}: {
  segments: Array<"up" | "down" | "none">;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground/50 tabular-nums">
        24h
      </span>
      <div className="flex items-center gap-0.5">
        {segments.map((seg, i) => {
          const hoursAgo = 24 - i;
          const timeLabel = hoursAgo === 1 ? "1h ago" : `${hoursAgo}h ago`;
          const statusLabel =
            seg === "none"
              ? "No data"
              : seg === "up"
                ? "All checks passed"
                : "At least one check failed";
          return (
            <span
              key={i}
              title={`${timeLabel}: ${statusLabel}`}
              className={cn(
                "inline-block size-2 rounded-full",
                seg === "up" && "bg-success/80",
                seg === "down" && "bg-destructive/80",
                seg === "none" && "bg-muted-foreground/20",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MonitorList({ monitors }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<MonitorWithStats[]>(monitors);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pauseConfirmId, setPauseConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setItems(monitors);
  }, [monitors]);

  const filtered = search.trim()
    ? items.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.url.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const monitorToPause = items.find((m) => m.id === pauseConfirmId) ?? null;
  const monitorToDelete = items.find((m) => m.id === deleteConfirmId) ?? null;

  function openCreate() {
    setEditingMonitor(null);
    setDialogOpen(true);
  }

  function openEdit(monitor: Monitor) {
    setEditingMonitor(monitor);
    setDialogOpen(true);
  }

  async function handleToggle(id: string, isActive: boolean) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, isActive } : m)));
    setPauseConfirmId(null);
    const result = await toggleMonitor(id, isActive);
    if (result.success) {
      toast.success(isActive ? "Monitor activated" : "Monitor paused");
      router.refresh();
    } else {
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive: !isActive } : m)),
      );
      toast.error(result.error);
    }
  }

  async function handleRunCheck(id: string) {
    setRunningId(id);
    try {
      const res = await fetch(`/api/monitors/${id}/check`, { method: "POST" });
      const outcome: CheckOutcome = await res.json();
      if (outcome.ok) {
        toast.success(`${outcome.statusCode} OK — ${outcome.latencyMs}ms`);
      } else {
        const label = outcome.errorType
          ? ERROR_LABELS[outcome.errorType]
          : "Check failed";
        toast.error(`${label} — ${outcome.latencyMs}ms`);
      }
      router.refresh();
    } catch {
      toast.error("Failed to reach the server");
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteMonitor(id);
    if (result.success) {
      setItems((prev) => prev.filter((m) => m.id !== id));
      toast.success("Monitor deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setDeletingId(null);
    setDeleteConfirmId(null);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Monitors
          </h1>
          {items.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {items.length}
            </span>
          )}
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-3.5" />
          Add monitor
        </Button>
      </div>

      {/* Search — only shown when there are monitors */}
      {items.length > 0 && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
          />
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Activity className="size-7 text-muted-foreground/50" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">
            No monitors yet
          </p>
          <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
            Add your first monitor to start tracking endpoint uptime and
            response time.
          </p>
          <Button onClick={openCreate} size="sm" className="mt-6">
            <Plus className="size-3.5" />
            Add monitor
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center py-10 text-center">
          <Search className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            No monitors match &ldquo;{search}&rdquo;
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((monitor) => (
            <div
              key={monitor.id}
              onClick={() => router.push(`/dashboard/monitors/${monitor.slug}`)}
              className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md hover:border-primary/30"
            >
              {/* Status dot */}
              <StatusDot status={monitor.status} />

              {/* Main info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {monitor.name}
                  </span>
                  <MonitorStatusBadge status={monitor.status} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px]",
                      ENV_BADGE_CLASSES[monitor.environment],
                    )}
                  >
                    {ENV_LABELS[monitor.environment]}
                  </Badge>
                </div>
                <p className="mt-0.5 max-w-[360px] truncate text-xs text-muted-foreground">
                  {monitor.url}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {monitor.uptimeSegments && (
                    <UptimeHistory segments={monitor.uptimeSegments} />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {monitor.uptime24h !== null
                      ? `${monitor.uptime24h.toFixed(1)}% uptime`
                      : "No data"}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    Every {formatInterval(monitor.intervalSec)}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    Checked {timeAgo(monitor.lastCheckedAt)}
                  </span>
                </div>
              </div>

              {/* Actions — always visible on mobile, opacity-0 on desktop until hover */}
              <div
                className="relative z-10 flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={monitor.isActive}
                  onCheckedChange={(checked) => {
                    if (!checked) setPauseConfirmId(monitor.id);
                    else handleToggle(monitor.id, true);
                  }}
                />

                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Run check now"
                  disabled={runningId === monitor.id}
                  onClick={() => handleRunCheck(monitor.id)}
                >
                  {runningId === monitor.id ? (
                    <RotateCcw className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(monitor)}
                  title="Edit"
                >
                  <Pencil className="size-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete"
                  disabled={deletingId === monitor.id}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteConfirmId(monitor.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pause confirm dialog */}
      <AlertDialog
        open={!!pauseConfirmId}
        onOpenChange={(open) => !open && setPauseConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{monitorToPause?.name}&rdquo; will stop sending checks
              until re-activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pauseConfirmId && handleToggle(pauseConfirmId, false)
              }
            >
              <Pause className="size-3.5" />
              Pause monitor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{monitorToDelete?.name}&rdquo;
              and all its check results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MonitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        monitor={editingMonitor}
      />
    </>
  );
}
