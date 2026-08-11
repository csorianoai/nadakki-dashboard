import { CreditForgeLayoutClient } from "./CreditForgeLayoutClient";
import { CreditForgeToaster } from "./CreditForgeToaster";

export default function CreditLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreditForgeLayoutClient>
      {children}
      <CreditForgeToaster />
    </CreditForgeLayoutClient>
  );
}
