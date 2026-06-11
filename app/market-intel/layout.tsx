import type { ReactNode } from "react";
import "./market-intel.css";

export const metadata = {
  title: "Inteligencia de Mercado | Nadakki",
  description: "Market Entry Engine — investigación y validación de mercado",
};

export default function MarketIntelLayout({ children }: { children: ReactNode }) {
  return <div className="market-intel-root">{children}</div>;
}
