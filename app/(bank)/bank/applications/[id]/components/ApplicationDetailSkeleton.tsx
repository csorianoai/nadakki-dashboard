export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Cargando detalle de solicitud">
      <div className="h-40 w-full animate-pulse rounded-xl bg-forgeGray-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-forgeGray-100" />
        <div className="h-48 animate-pulse rounded-xl bg-forgeGray-100" />
        <div className="h-56 animate-pulse rounded-xl bg-forgeGray-100 lg:col-span-2" />
        <div className="h-36 animate-pulse rounded-xl bg-forgeGray-100" />
        <div className="h-36 animate-pulse rounded-xl bg-forgeGray-100" />
      </div>
    </div>
  );
}
