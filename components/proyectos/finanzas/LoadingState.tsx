import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/forge";

export function FinanzasLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-amber-400" aria-hidden />
        Sincronizando datos financieros…
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
