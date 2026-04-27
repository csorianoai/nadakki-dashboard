import { cn } from "@/lib/utils";
import { ForgeLogo } from "./ForgeLogo";

interface ForgeWordmarkProps {
  className?: string;
}

export function ForgeWordmark({ className }: ForgeWordmarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <ForgeLogo size="sm" />
      <span className="font-display text-xl font-bold tracking-tight text-forge-text">
        Nadakki Forge
      </span>
    </div>
  );
}
