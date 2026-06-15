export default function IncidentDetailLoading() {
  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-64 rounded bg-muted" />

      {/* Header */}
      <div className="mt-4 rounded-xl border bg-card px-6 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-5 rounded bg-muted" />
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
        <div className="h-4 w-56 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Snapshot */}
      <div className="mt-6 space-y-3">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="rounded-xl border bg-card px-6 py-5">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Triage */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-8 rounded-full bg-muted" />
        </div>
        <div className="rounded-xl border bg-card px-6 py-5 space-y-5">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 w-5/6 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
