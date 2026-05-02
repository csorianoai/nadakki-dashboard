import { CreditHubLayoutClient } from "./CreditHubLayoutClient";

export default function CreditHubLayout({ children }: { children: React.ReactNode }) {
  return <CreditHubLayoutClient>{children}</CreditHubLayoutClient>;
}
