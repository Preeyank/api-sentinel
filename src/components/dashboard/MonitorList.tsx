"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, Activity } from "lucide-react";
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
import { MonitorDialog } from "@/components/dashboard/MonitorDialog";
import { deleteMonitor, toggleMonitor } from "@/lib/actions/monitors";

type Monitor = {
  id: string;
  name: string;
  url: string;
  environment: string;
  intervalSec: number;
  expectedStatus: number;
  timeoutMs: number;
  isActive: boolean;
  slug: string;
  createdAt: Date;
  lastCheckedAt: Date | null;
};

const ENV_LABELS: Record<string, string> = {
  PROD: "Production",
  STAGING: "Staging",
  DEV: "Development",
};

function formatInterval(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${sec / 60}m`;
  return `${sec / 3600}h`;
}

type Props = {
  monitors: Monitor[];
};

export function MonitorList({ monitors }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openCreate() {
    setEditingMonitor(null);
    setDialogOpen(true);
  }

  function openEdit(monitor: Monitor) {
    setEditingMonitor(monitor);
    setDialogOpen(true);
  }

  async function handleToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    await toggleMonitor(id, isActive);
    router.refresh();
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteMonitor(id);
    router.refresh();
    setDeletingId(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {monitors.length === 0
            ? "No monitors yet."
            : `${monitors.length} monitor${monitors.length === 1 ? "" : "s"}`}
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-3.5" />
          Add monitor
        </Button>
      </div>

      {monitors.length === 0 ? (
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
          {monitors.map((monitor) => (
            <div
              key={monitor.id}
              className="flex items-center gap-4 px-4 py-3.5"
            >
              {/* Icon */}
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Globe className="size-4 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {monitor.name}
                  </p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {ENV_LABELS[monitor.environment] ?? monitor.environment}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="truncate max-w-[260px]">{monitor.url}</span>
                  <span>·</span>
                  <span>Every {formatInterval(monitor.intervalSec)}</span>
                  <span>·</span>
                  <span>Status {monitor.expectedStatus}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={monitor.isActive}
                  disabled={togglingId === monitor.id}
                  onCheckedChange={(checked) =>
                    handleToggle(monitor.id, checked)
                  }
                />

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

                <AlertDialog
                  open={deleteConfirmId === monitor.id}
                  onOpenChange={(open) =>
                    !open && setDeleteConfirmId(null)
                  }
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete monitor?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &ldquo;{monitor.name}
                        &rdquo; and all its check results. This cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(monitor.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <MonitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        monitor={editingMonitor}
      />
    </>
  );
}
