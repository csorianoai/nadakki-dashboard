import type { ReactNode } from "react";
import { LegalLayoutClient } from "./LegalLayoutClient";

// Sin esto, las pantallas de Legal heredaban «Credit Hub» del grupo (forge) en la pestaña.
export const metadata = { title: "Legal · Nadakki" };

export default function LegalForgeLayout({ children }: { children: ReactNode }) {
  return <LegalLayoutClient>{children}</LegalLayoutClient>;
}
