import { cn } from "@/lib/utils";

export function VehicleCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-r border border-nk-border bg-nk-surface shadow-nk-sm",
        className,
      )}
      aria-hidden
    >
      <div className="aspect-[4/3] animate-nkShimmer bg-nk-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-nkShimmer rounded bg-nk-surface-2" />
        <div className="h-3 w-1/2 animate-nkShimmer rounded bg-nk-surface-2" />
        <div className="h-5 w-2/5 animate-nkShimmer rounded bg-nk-surface-2" />
        <div className="h-4 w-3/5 animate-nkShimmer rounded bg-nk-surface-2" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 animate-nkShimmer rounded-r-sm bg-nk-surface-2" />
          <div className="h-8 w-16 animate-nkShimmer rounded-r-sm bg-nk-surface-2" />
        </div>
      </div>
    </article>
  );
}
