import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your API monitoring dashboard. Add monitors to start tracking uptime.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Activity className="size-7 text-muted-foreground/50" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          No monitors yet
        </h2>
        <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
          Monitors let you track the uptime and response time of your APIs.
          They&apos;ll appear here once you create them.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-amber-400" />
          Monitors are coming soon
        </div>
      </div>
    </div>
  );
}
