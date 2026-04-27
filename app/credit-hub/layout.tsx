import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { CHQueryProvider } from "@/components/credit-hub/system/CHQueryProvider";
import "./forge-globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--forge-font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--forge-font-mono",
  display: "swap",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--forge-font-display",
  display: "swap",
});

export default function CreditHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`}>
      <CHQueryProvider>{children}</CHQueryProvider>
    </div>
  );
}
