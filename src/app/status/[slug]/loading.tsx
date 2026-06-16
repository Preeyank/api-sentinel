export default function StatusLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="mx-auto max-w-2xl px-4 py-16">

        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>

        {/* Status */}
        <div className="rounded-xl border bg-card px-6 py-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-5 rounded-full bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        </div>

        {/* Uptime */}
        <div className="rounded-xl border bg-card px-6 py-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        </div>

        {/* Incidents */}
        <div className="rounded-xl border bg-card px-6 py-5 mb-4 space-y-4">
          <div className="h-4 w-32 rounded bg-muted" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-muted" />
                <div className="h-4 w-14 rounded-full bg-muted" />
              </div>
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
