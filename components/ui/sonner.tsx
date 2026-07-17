"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Autos marketplace toast — dark fg-on-bg style per README §9. */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="bottom-center"
      duration={2400}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--fg,#0D1626)] group-[.toaster]:text-[var(--bg,#F5F8FC)] group-[.toaster]:border-transparent group-[.toaster]:shadow-[var(--shadow-lg)] group-[.toaster]:rounded-[var(--r-sm,11px)] animate-nkToast",
          description: "group-[.toast]:text-[var(--bg,#F5F8FC)]/80",
          success: "group-[.toaster]:[&_[data-icon]]:text-[var(--success-2,#10B981)]",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
