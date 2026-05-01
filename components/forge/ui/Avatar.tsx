"use client";

import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-forge-xs",
  md: "h-10 w-10 text-forge-sm",
  lg: "h-14 w-14 text-forge-md",
};

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const initials = (fallback ?? alt).slice(0, 2).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Forge primitive; callers supply trusted avatar URLs.
      <img
        src={src}
        alt={alt}
        className={cn(
          "inline-block rounded-forge-pill object-cover ring-2 ring-forgeSurface-card",
          sizes[size],
          className
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-forge-pill bg-forgeBrand-100 font-semibold text-forgeBrand-700 ring-2 ring-forgeSurface-card",
        sizes[size],
        className
      )}
      aria-label={alt}
    >
      {initials}
    </span>
  );
}
