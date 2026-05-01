"use client";

import { ForgeToaster } from "@/components/forge";

/** Single Sonner host for legacy `/credit/*` routes (e.g. DocumentUploader). Forge Credit Hub mounts its own in `ForgeCreditHubAppShell`. */
export function CreditForgeToaster() {
  return <ForgeToaster />;
}
