"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "inset" | "outlined";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: "border border-forgeInk-200 bg-forgeSurface-card shadow-forge-xs",
  inset: "border border-forgeInk-200 bg-forgeSurface-sunken shadow-none",
  outlined: "border border-forgeInk-300 bg-forgeSurface-card shadow-none",
};

export function Card({ variant = "default", className, ...props }: CardProps) {
  return <div className={cn("rounded-forge-md p-6", variants[variant], className)} {...props} />;
}
