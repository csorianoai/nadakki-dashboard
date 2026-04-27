import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { CHQueryProvider } from "@/components/credit-hub/system/CHQueryProvider";
import "./credit-hub/forge-globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--forge-font-sans",
  display: "swap",
  preload: true,
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

export const metadata = {
  title: "Nadakki Forge",
  description: "Where credit decisions are forged",
};

export default function ForgeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} forge-app antialiased`}>
      <CHQueryProvider>{children}</CHQueryProvider>
    </div>
  );
}
