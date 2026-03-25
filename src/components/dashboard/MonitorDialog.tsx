"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonitorFormSchema, type MonitorFormValues } from "@/lib/validations/monitor";
import { createMonitor, updateMonitor } from "@/lib/actions/monitors";

const INTERVALS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
];

const ENVIRONMENTS = [
  { label: "Production", value: "PROD" },
  { label: "Staging", value: "STAGING" },
  { label: "Development", value: "DEV" },
];

const DEFAULT_VALUES: MonitorFormValues = {
  name: "",
  url: "",
  environment: "PROD",
  intervalSec: 60,
  expectedStatus: 200,
  timeoutMs: 5000,
};

type MonitorForDialog = {
  id: string;
  name: string;
  url: string;
  environment: string;
  intervalSec: number;
  expectedStatus: number;
  timeoutMs: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monitor?: MonitorForDialog | null;
};

export function MonitorDialog({ open, onOpenChange, monitor }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MonitorFormValues>({
    resolver: zodResolver(MonitorFormSchema),
    defaultValues: monitor
      ? {
          name: monitor.name,
          url: monitor.url,
          environment: monitor.environment as MonitorFormValues["environment"],
          intervalSec: monitor.intervalSec,
          expectedStatus: monitor.expectedStatus,
          timeoutMs: monitor.timeoutMs,
        }
      : DEFAULT_VALUES,
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset(monitor ? undefined : DEFAULT_VALUES);
      setServerError(null);
    }
    onOpenChange(open);
  }

  async function onSubmit(values: MonitorFormValues) {
    setServerError(null);
    const result = monitor
      ? await updateMonitor(monitor.id, values)
      : await createMonitor(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    handleOpenChange(false);
    router.refresh();
  }

  const isEdit = !!monitor;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit monitor" : "Add monitor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the configuration for this monitor."
              : "Configure a new HTTP endpoint to monitor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My API"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://api.example.com/health"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Environment + Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Environment</Label>
              <Controller
                name="environment"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.environment && (
                <p className="text-xs text-destructive">
                  {errors.environment.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Interval</Label>
              <Controller
                name="intervalSec"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVALS.map((i) => (
                        <SelectItem key={i.value} value={String(i.value)}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.intervalSec && (
                <p className="text-xs text-destructive">
                  {errors.intervalSec.message}
                </p>
              )}
            </div>
          </div>

          {/* Expected Status + Timeout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expectedStatus">Expected status</Label>
              <Input
                id="expectedStatus"
                type="number"
                {...register("expectedStatus", { valueAsNumber: true })}
              />
              {errors.expectedStatus && (
                <p className="text-xs text-destructive">
                  {errors.expectedStatus.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timeoutMs">Timeout (ms)</Label>
              <Input
                id="timeoutMs"
                type="number"
                {...register("timeoutMs", { valueAsNumber: true })}
              />
              {errors.timeoutMs && (
                <p className="text-xs text-destructive">
                  {errors.timeoutMs.message}
                </p>
              )}
            </div>
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create monitor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
