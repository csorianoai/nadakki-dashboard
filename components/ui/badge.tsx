import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:shadow-[var(--ring)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--brand,#1E40AF)] text-[var(--on-brand,#fff)]",
        secondary:
          "border-transparent bg-[var(--surface-2,#F1F5F9)] text-[var(--fg,#0D1626)]",
        outline: "border-[var(--border,#E4EAF2)] text-[var(--fg-muted,#586A82)]",
        brandSoft:
          "border-transparent bg-[var(--brand-soft,#EEF3FF)] text-[var(--brand,#1E40AF)]",
        success:
          "border-transparent bg-[var(--success-soft,#E5F6EF)] text-[var(--success,#0F9F6E)]",
        warning:
          "border-transparent bg-[var(--warning-soft,#FCF2E1)] text-[var(--warning,#D97706)]",
        danger:
          "border-transparent bg-[var(--danger-soft,#FDECEC)] text-[var(--danger,#DC2626)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
