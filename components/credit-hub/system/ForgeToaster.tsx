"use client";

/**
 * @deprecated Import `ForgeToaster` and `toast` from `@/components/forge` (Sonner).
 * Re-exports kept so legacy `forgeToast.*` call sites keep working until migrated.
 */
import { ForgeToaster as ForgeSonnerToaster, toast } from "@/components/forge/ui/Toast";

export { ForgeSonnerToaster as ForgeToaster };

export const forgeToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
};
