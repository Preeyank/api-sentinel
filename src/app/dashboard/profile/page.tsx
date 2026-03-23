import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
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

      <div className="divide-y rounded-xl border bg-card">
        <Row label="Name" value={session.user.name} />

        <Row label="Email">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {session.user.email}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                dbUser?.emailVerified
                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
              )}
            >
              {dbUser?.emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </Row>

        <Row label="Role">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
            {dbUser?.role ?? "USER"}
          </span>
        </Row>

        <Row label="Plan">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            {planLabel}
          </span>
        </Row>

        <Row label="Member since" value={memberSince} />
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
