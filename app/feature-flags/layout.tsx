import type { ReactNode } from "react";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";

/** /feature-flags: flags de toda la plataforma, solo superadmin. */
export default function FeatureFlagsLayout({ children }: { children: ReactNode }) {
  return <SoloSuperadminDePlataforma>{children}</SoloSuperadminDePlataforma>;
}
