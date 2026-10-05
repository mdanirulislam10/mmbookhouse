/** Shown instantly inside the admin shell while a panel page renders. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-56 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 rounded-lg border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-4 rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
