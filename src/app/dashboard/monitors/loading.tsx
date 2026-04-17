export default function MonitorsLoading() {
  return (
    <div className="max-w-4xl p-6 lg:p-8 animate-pulse">
      {/* Add button placeholder */}
      <div className="flex items-center justify-end">
        <div className="h-8 w-28 rounded-lg bg-muted" />
      </div>

      {/* Monitor rows */}
      <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="size-9 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-5 w-12 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
              <div className="h-3 w-72 rounded bg-muted" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-5 w-9 rounded-full bg-muted" />
              <div className="size-7 rounded bg-muted" />
              <div className="size-7 rounded bg-muted" />
              <div className="size-7 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
