"use client";

import { Toaster as SonnerToaster, toast } from "sonner";
import { cn } from "@/lib/utils";

export function ForgeToaster({ className }: { className?: string }) {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: cn(
            "rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card text-forgeInk-800 shadow-forge-md",
            className
          ),
          title: "font-medium text-forge-sm text-forgeInk-800",
          description: "text-forge-xs text-forgeInk-500",
          actionButton:
            "rounded-forge-sm bg-forgeBrand-500 px-3 py-1.5 text-forge-xs font-medium text-forgeInk-50",
          cancelButton: "rounded-forge-sm border border-forgeInk-200 px-3 py-1.5 text-forge-xs text-forgeInk-700",
          closeButton: "text-forgeInk-500 hover:bg-forgeSurface-sunken",
        },
      }}
    />
  );
}

export { toast };
