export default function MobileUploadLoading() {
  return (
    <div className="space-y-3 py-8" aria-busy="true" aria-live="polite">
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="h-28 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded bg-slate-200" />
    </div>
  );
}
