/** Shown instantly while a shop page renders on the server, so navigation never feels stuck. */
export default function ShopLoading() {
  return (
    <div className="container-page animate-pulse py-6" aria-busy="true" aria-label="Loading">
      <div className="mb-5 h-6 w-48 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-white p-2">
            <div className="aspect-[3/4] w-full rounded bg-slate-200" />
            <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
            <div className="mt-1.5 h-3 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
