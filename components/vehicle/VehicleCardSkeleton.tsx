import { cn } from "@/lib/utils";

export function VehicleCardSkeleton({
  className,
  variant = "grid",
}: {
  className?: string;
  variant?: "grid" | "list" | "compact";
}) {
  if (variant === "list") {
    return (
      <article
        className={cn(
          "grid grid-cols-1 gap-4 rounded-r border border-nk-border bg-nk-surface p-4 md:grid-cols-[33%_40%_27%]",
          className,
        )}
        aria-hidden
      >
        <div className="aspect-[4/3] animate-nkShimmer rounded-r-sm bg-nk-surface-2" />
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-nkShimmer rounded bg-nk-surface-2" />
          <div className="h-3 w-full animate-nkShimmer rounded bg-nk-surface-2" />
          <div className="h-3 w-2/3 animate-nkShimmer rounded bg-nk-surface-2" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-1/2 animate-nkShimmer rounded bg-nk-surface-2" />
          <div className="h-10 w-full animate-nkShimmer rounded-r-sm bg-nk-surface-2" />
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article
        className={cn(
          "mx-auto max-w-[240px] overflow-hidden rounded-r border border-nk-border bg-nk-surface",
          className,
        )}
        aria-hidden
      >
        <div className="aspect-[3/2] animate-nkShimmer bg-nk-surface-2" />
        <div className="space-y-2 p-3">
          <div className="h-4 w-4/5 animate-nkShimmer rounded bg-nk-surface-2" />
          <div className="h-4 w-2/5 animate-nkShimmer rounded bg-nk-surface-2" />
          <div className="h-3 w-3/5 animate-nkShimmer rounded bg-nk-surface-2" />
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-r border border-nk-border bg-nk-surface shadow-nk-sm",
        className,
      )}
      aria-hidden
    >
      <div className="aspect-[16/10] animate-nkShimmer bg-nk-surface-2" />
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
