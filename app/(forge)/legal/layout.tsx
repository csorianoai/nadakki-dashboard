import type { ReactNode } from "react";
import { LegalLayoutClient } from "./LegalLayoutClient";

export default function LegalForgeLayout({ children }: { children: ReactNode }) {
  return <LegalLayoutClient>{children}</LegalLayoutClient>;
}
