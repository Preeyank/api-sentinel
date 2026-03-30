"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, Activity, Play } from "lucide-react";
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
import { deleteMonitor, toggleMonitor } from "@/lib/actions/monitors";
import {
  ENV_LABELS,
  ERROR_LABELS,
  type Environment,
} from "@/lib/constants/monitors";
import { formatInterval, timeAgo } from "@/lib/utils";
import type { CheckOutcome } from "@/types/checks";

type Monitor = {
  id: string;
  name: string;
  url: string;
  environment: Environment;
  intervalSec: number;
  expectedStatus: number;
  timeoutMs: number;
  isActive: boolean;
  slug: string;
  createdAt: Date;
  lastCheckedAt: Date | null;
};

type Props = {
  monitors: Monitor[];
};

export function MonitorList({ monitors }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(monitors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pauseConfirmId, setPauseConfirmId] = useState<string | null>(null);

  // Sync local state when server re-renders with fresh data
  useEffect(() => {
    setItems(monitors);
  }, [monitors]);

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
      // Revert optimistic update
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
      {items.length > 0 && (
        <div className="flex items-center justify-end">
          <Button onClick={openCreate} size="sm">
            <Plus className="size-3.5" />
            Add monitor
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Activity className="size-6 text-muted-foreground/50" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            No monitors yet
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Add your first monitor to start tracking endpoint uptime and
            response time.
          </p>
          <Button onClick={openCreate} size="sm" className="mt-5">
            <Plus className="size-3.5" />
            Add monitor
          </Button>
        </div>
      ) : (
        <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((monitor) => (
            <div
              key={monitor.id}
              className="flex items-center gap-4 px-4 py-3.5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Globe className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {monitor.name}
                  </p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {ENV_LABELS[monitor.environment]}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="truncate max-w-[260px]">{monitor.url}</span>
                  <span>·</span>
                  <span>Every {formatInterval(monitor.intervalSec)}</span>
                  <span>·</span>
                  <span>Status {monitor.expectedStatus}</span>
                  <span>·</span>
                  <span>Checked {timeAgo(monitor.lastCheckedAt)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={monitor.isActive}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setPauseConfirmId(monitor.id);
                    } else {
                      handleToggle(monitor.id, true);
                    }
                  }}
                />

                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Run now"
                  disabled={runningId === monitor.id}
                  onClick={() => handleRunCheck(monitor.id)}
                >
                  <Play className="size-3.5" />
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

      {/* Single pause dialog — hoisted outside the list */}
      <AlertDialog
        open={!!pauseConfirmId}
        onOpenChange={(open) => !open && setPauseConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{monitorToPause?.name}&rdquo; will stop sending checks
              until it is re-activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pauseConfirmId && handleToggle(pauseConfirmId, false)
              }
            >
              Pause monitor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single delete dialog — hoisted outside the list */}
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
