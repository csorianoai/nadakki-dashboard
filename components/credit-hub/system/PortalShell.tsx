"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ForgePersona } from "@/lib/credit-hub/design/persona";
import { PersonaProvider } from "./PersonaProvider";

interface PortalShellProps {
  persona: ForgePersona;
  children: ReactNode;
  className?: string;
}

export function PortalShell({ persona, children, className }: PortalShellProps) {
  return (
    <PersonaProvider persona={persona}>
      <div data-portal={persona} className={cn("min-h-screen bg-forge-bg text-forge-text font-sans", className)}>
        {children}
      </div>
    </PersonaProvider>
  );
}
