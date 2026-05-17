export function QueueSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Cargando bandeja">
      <div className="h-10 w-full animate-pulse rounded-lg bg-forgeGray-100" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-forgeGray-100" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-forgeGray-100" />
    </div>
  );
}
