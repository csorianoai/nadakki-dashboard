"use client";

import { Toaster as SonnerToaster, toast } from "sonner";
import { cn } from "@/lib/utils";

export function ForgeToaster({ className }: { className?: string }) {
  return (
    <SonnerToaster
      position="top-right"
      visibleToasts={3}
      closeButton
      toastOptions={{
        classNames: {
          toast: cn(
            "rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card text-forgeGray-800 shadow-forge-md",
            "motion-reduce:transition-none motion-reduce:animate-none",
            className
          ),
          title: "font-medium text-forge-sm text-forgeGray-800",
          description: "text-forge-xs text-forgeGray-500",
          actionButton:
            "rounded-forge-sm bg-forgeBrand-500 px-3 py-1.5 text-forge-xs font-medium text-forgeGray-50",
          cancelButton: "rounded-forge-sm border border-forgeGray-200 px-3 py-1.5 text-forge-xs text-forgeGray-700",
          closeButton: "text-forgeGray-500 hover:bg-forgeSurface-sunken",
        },
      }}
    />
  );
}

export { toast };
