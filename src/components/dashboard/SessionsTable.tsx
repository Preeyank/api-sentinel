"use client";

import { useState, useEffect } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { Monitor, Smartphone, Globe, Trash2, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  token: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function parseDevice(ua: string | null | undefined): {
  label: string;
  Icon: typeof Monitor;
} {
  if (!ua) return { label: "Unknown device", Icon: Globe };
  if (/mobile|android|iphone|ipad/i.test(ua))
    return { label: "Mobile device", Icon: Smartphone };
  if (/edg\//i.test(ua)) return { label: "Edge", Icon: Monitor };
  if (/chrome/i.test(ua)) return { label: "Chrome", Icon: Monitor };
  if (/firefox/i.test(ua)) return { label: "Firefox", Icon: Monitor };
  if (/safari/i.test(ua)) return { label: "Safari", Icon: Monitor };
  return { label: "Desktop browser", Icon: Monitor };
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionsTable() {
  const { data: currentSessionData } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingOther, setRevokingOther] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    authClient.listSessions().then(({ data }) => {
      if (!cancelled) {
        setSessions((data as Session[]) ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function revokeSession(token: string) {
    setRevoking(token);
    await authClient.revokeSession({ token });
    refresh();
    setRevoking(null);
  }

  async function revokeOtherSessions() {
    setRevokingOther(true);
    await authClient.revokeOtherSessions();
    refresh();
    setRevokingOther(false);
  }

  const currentToken = currentSessionData?.session?.token;
  const otherCount = sessions.filter((s) => s.token !== currentToken).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {otherCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={revokeOtherSessions}
            disabled={revokingOther}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <ShieldOff className="size-3.5" />
            {revokingOther
              ? "Signing out…"
              : `Sign out ${otherCount} other ${otherCount === 1 ? "session" : "sessions"}`}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((session) => {
          const isCurrent = session.token === currentToken;
          const { label, Icon } = parseDevice(session.userAgent);
          return (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-card p-4",
                isCurrent && "ring-1 ring-primary/20",
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {label}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {session.ipAddress && <span>{session.ipAddress}</span>}
                  <span>{formatDate(session.createdAt)}</span>
                </div>
              </div>

              {!isCurrent && (
                <button
                  onClick={() => revokeSession(session.token)}
                  disabled={revoking === session.token}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3" />
                  {revoking === session.token ? "Revoking…" : "Revoke"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
