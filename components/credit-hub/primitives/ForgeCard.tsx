import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ForgeCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export const ForgeCard = forwardRef<HTMLDivElement, ForgeCardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => {
    const variants = {
      default: "bg-forge-surface border border-forge-border",
      elevated: "bg-forge-surface-elevated border border-forge-border shadow-md",
      interactive:
        "bg-forge-surface border border-forge-border hover:border-forge-border-hover hover:bg-forge-surface-hover transition-colors cursor-pointer",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div ref={ref} className={cn("rounded-2xl", variants[variant], paddings[padding], className)} {...props}>
        {children}
      </div>
    );
  }
);

ForgeCard.displayName = "ForgeCard";
