import { cn } from "@/lib/utils";
import { ForgeLogo } from "./ForgeLogo";

interface ForgeLoadingMarkProps {
  label?: string;
  className?: string;
}

export function ForgeLoadingMark({ label = "Cargando Forge", className }: ForgeLoadingMarkProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-3 text-forge-text-muted", className)}>
      <ForgeLogo size="lg" className="animate-forge-pulse-slow" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
