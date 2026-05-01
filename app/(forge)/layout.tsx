import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { CHQueryProvider } from "@/components/credit-hub/system/CHQueryProvider";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--forge-font-sans",
  display: "swap",
  preload: true,
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--forge-font-mono-opt",
  display: "swap",
});

const fontDisplay = Source_Serif_4({
  subsets: ["latin"],
  variable: "--forge-font-display-opt",
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
