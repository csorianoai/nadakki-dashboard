import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[var(--r,16px)] border border-[var(--border,#E4EAF2)] bg-[var(--surface,#fff)] px-3 py-2 text-sm text-[var(--fg,#0D1626)] shadow-[var(--shadow-sm)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--fg-subtle,#8A99AD)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
