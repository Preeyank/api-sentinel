import { SessionsTable } from "@/components/dashboard/SessionsTable";

export default function SessionsPage() {
  return (
    <div className="max-w-3xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Active Sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage devices that are currently signed in to your account.
        </p>
      </div>
      <SessionsTable />
    </div>
  );
}
