"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "inset" | "outlined";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default:
    "border border-forgeGray-200 bg-forgeSurface-card shadow-forge-xs transition-shadow duration-100 ease-out motion-reduce:transition-none hover:shadow-forge-md",
  inset: "border border-forgeGray-200 bg-forgeSurface-sunken shadow-none",
  outlined: "border border-forgeGray-300 bg-forgeSurface-card shadow-none",
};

export function Card({ variant = "default", className, ...props }: CardProps) {
  return <div className={cn("rounded-forge-md p-6", variants[variant], className)} {...props} />;
}
