import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ReactNode } from "react";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, plan: true, createdAt: true, emailVerified: true },
  });

  const planLabel = dbUser?.plan
    ? dbUser.plan.charAt(0).toUpperCase() + dbUser.plan.slice(1).toLowerCase()
    : "Free";

  const memberSince = new Date(
    dbUser?.createdAt ?? new Date(),
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const initials = session.user.name
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account information.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Avatar header */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-5 py-5">
          <Avatar className="size-14 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">
              {session.user.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="uppercase tracking-wider text-[10px] font-semibold"
          >
            {planLabel}
          </Badge>
        </div>

        {/* Info rows */}
        <div className="divide-y">
          <Row label="Name" value={session.user.name} />

          <Row label="Email">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">
                {session.user.email}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  dbUser?.emailVerified
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {dbUser?.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </Row>

          <Row label="Role">
            <Badge variant="secondary">{dbUser?.role ?? "USER"}</Badge>
          </Row>

          <Row label="Plan">
            <Badge
              variant="secondary"
              className="uppercase tracking-wider text-[10px] font-semibold"
            >
              {planLabel}
            </Badge>
          </Row>

          <Row label="Member since" value={memberSince} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children ?? (
        <span className="text-sm font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}
