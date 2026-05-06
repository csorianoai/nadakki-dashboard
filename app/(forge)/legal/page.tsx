"use client";

import LegalHomeContent from "@/components/legal/LegalHomeContent";
import { LegalTaskExecuteProvider } from "@/hooks/useExecuteLegalTask";

export default function LegalForgeHomePage() {
  return (
    <LegalTaskExecuteProvider>
      <LegalHomeContent />
    </LegalTaskExecuteProvider>
  );
}
