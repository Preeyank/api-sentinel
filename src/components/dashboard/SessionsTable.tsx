"use client";

import { useState, useEffect } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";
import { Monitor, Smartphone, Globe, Trash2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {otherCount > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={revokeOtherSessions}
            disabled={revokingOther}
            variant="destructive"
            size="sm"
          >
            <ShieldOff className="size-3.5" />
            {revokingOther
              ? "Signing out…"
              : `Sign out ${otherCount} other ${otherCount === 1 ? "session" : "sessions"}`}
          </Button>
        </div>
      )}

      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {sessions.map((session) => {
          const isCurrent = session.token === currentToken;
          const { label, Icon } = parseDevice(session.userAgent);
          return (
            <div
              key={session.id}
              className="flex items-center gap-4 px-4 py-3.5"
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
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      Current
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {session.ipAddress && <span>{session.ipAddress}</span>}
                  <span>Signed in {formatDate(session.createdAt)}</span>
                  <span>·</span>
                  <span className="text-muted-foreground/70">
                    Expires {formatDate(session.expiresAt)}
                  </span>
                </div>
              </div>

              {!isCurrent && (
                <Button
                  onClick={() => revokeSession(session.token)}
                  disabled={revoking === session.token}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="size-3.5" />
                  {revoking === session.token ? "Revoking…" : "Revoke"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
