import { type ReactNode } from "react";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div data-testid="cockpit-finance-layout">
      <FinanceSubNav />
      {children}
    </div>
  );
}
