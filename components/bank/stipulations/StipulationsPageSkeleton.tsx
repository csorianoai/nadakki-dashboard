"use client";

/** Skeleton list for stipulations route (no spinners). */
export function StipulationsPageSkeleton() {
  return (
    <div className="bank-stipulations-print mx-auto max-w-3xl space-y-6 p-4 md:p-8" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-forgeGray-100" />
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-forgeGray-100" />
      <div className="space-y-4">
        {[1, 2, 3].map((k) => (
          <div key={k} className="rounded-xl border border-forgeGray-100 p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-forgeGray-100" />
            <div className="mt-3 h-5 w-3/4 max-w-md animate-pulse rounded bg-forgeGray-100" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-forgeGray-50" />
            <div className="mt-4 flex gap-2">
              <div className="h-9 w-28 animate-pulse rounded-lg bg-forgeGray-100" />
              <div className="h-9 w-28 animate-pulse rounded-lg bg-forgeGray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
