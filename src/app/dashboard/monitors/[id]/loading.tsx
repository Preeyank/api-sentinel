export default function MonitorDetailLoading() {
  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-32 rounded bg-muted" />

      {/* Header */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
        </div>
        <div className="h-4 w-64 rounded bg-muted" />
        <div className="h-3 w-80 rounded bg-muted" />
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-6 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-48 rounded-xl border bg-card" />
      </div>

      {/* History table */}
      <div className="mt-6 space-y-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-64 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
