import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { DealerChShell } from "@/components/credit-hub/dealer/DealerChShell";

export const metadata: Metadata = {
  title: {
    default: "Nadakki Dealer",
    template: "%s | Nadakki Dealer",
  },
  description: "Plataforma de creditos automotrices para dealers",
  manifest: "/manifest-dealer.json",
  appleWebApp: {
    capable: true,
    title: "Nadakki Dealer",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.dealer">
      <DealerChShell>{children}</DealerChShell>
    </RouteErrorBoundary>
  );
}
