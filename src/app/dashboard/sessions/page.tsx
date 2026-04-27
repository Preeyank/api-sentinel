import { SessionsTable } from "@/components/sessions/SessionsTable";

export default function SessionsPage() {
  return (
    <div className="max-w-3xl p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Active Sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices and browsers currently signed into your account.
        </p>
      </div>
      <SessionsTable />
    </div>
  );
}
