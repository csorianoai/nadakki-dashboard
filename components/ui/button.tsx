"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--r-sm,11px)] text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:shadow-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand,#1E40AF)] text-[var(--on-brand,#fff)] hover:brightness-110 shadow-[var(--shadow-sm)]",
        brand:
          "bg-gradient-to-br from-[var(--brand,#1E40AF)] to-[var(--brand-2,#3B82F6)] text-[var(--on-brand,#fff)] hover:brightness-110 shadow-[var(--shadow-md)]",
        outline:
          "border border-[var(--border,#E4EAF2)] bg-[var(--surface,#fff)] text-[var(--fg,#0D1626)] hover:bg-[var(--surface-2,#F1F5F9)]",
        ghost:
          "text-[var(--fg-muted,#586A82)] hover:bg-[var(--surface-2,#F1F5F9)] hover:text-[var(--fg,#0D1626)]",
        secondary:
          "bg-[var(--surface-2,#F1F5F9)] text-[var(--fg,#0D1626)] hover:bg-[var(--surface-3,#E9EEF6)]",
        destructive:
          "bg-[var(--danger,#DC2626)] text-white hover:brightness-110",
        link: "text-[var(--brand,#1E40AF)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-10 px-4 py-2",
        sm: "h-9 min-h-9 rounded-[var(--r-sm,11px)] px-3 text-xs",
        lg: "h-11 min-h-11 rounded-[var(--r,16px)] px-6",
        icon: "h-10 w-10 min-h-10 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
