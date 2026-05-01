import { CreditForgeToaster } from "./CreditForgeToaster";

export default function CreditLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CreditForgeToaster />
    </>
  );
}
