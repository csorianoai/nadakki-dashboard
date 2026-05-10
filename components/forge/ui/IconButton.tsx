"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "default" | "subtle";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  "aria-label": string;
  children: ReactNode;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    "bg-forgeSurface-card text-forgeGray-800 border border-forgeGray-200 hover:bg-forgeSurface-sunken disabled:cursor-not-allowed disabled:border-forgeGray-200 disabled:bg-forgeGray-100 disabled:text-forgeGray-300 disabled:hover:bg-forgeGray-100",
  subtle:
    "border border-transparent bg-transparent text-forgeGray-600 hover:bg-forgeSurface-sunken disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-forgeGray-300 disabled:hover:bg-transparent",
};

export function IconButton({ variant = "default", className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-forge-sm transition-colors duration-100 ease-out motion-reduce:transition-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{children}</span>
    </button>
  );
}
