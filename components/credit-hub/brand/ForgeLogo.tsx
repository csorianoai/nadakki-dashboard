import { cn } from "@/lib/utils";

interface ForgeLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "mark" | "wordmark" | "full";
  animated?: boolean;
  className?: string;
}

export function ForgeLogo({
  size = "md",
  variant = "mark",
  animated = false,
  className,
}: ForgeLogoProps) {
  const sizes = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const mark = (
    <svg
      viewBox="0 0 40 40"
      className={cn(sizes[size], animated && "transition-transform hover:scale-110", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nadakki Forge"
      role="img"
    >
      <defs>
        <linearGradient id="forge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--forge-primary)" />
          <stop offset="100%" stopColor="var(--forge-accent)" />
        </linearGradient>
      </defs>
      <rect x="8" y="6" width="6" height="28" rx="2" fill="url(#forge-gradient)" />
      <rect x="8" y="6" width="22" height="6" rx="2" fill="url(#forge-gradient)" />
      <rect x="8" y="16" width="16" height="5" rx="1.5" fill="url(#forge-gradient)" />
      <path d="M27 24h6l-3 8h-9l3-4h-4l3-8h7l-3 4Z" fill="var(--forge-accent)" opacity="0.9" />
      <circle cx="32" cy="10" r="2" fill="var(--forge-accent)" />
    </svg>
  );

  if (variant === "mark") return mark;

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {mark}
      <span className="font-display font-bold tracking-tight text-forge-text">
        {variant === "full" ? "Nadakki Forge" : "Forge"}
      </span>
    </span>
  );
}
