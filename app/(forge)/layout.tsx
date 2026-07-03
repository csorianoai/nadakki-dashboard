import { CHQueryProvider } from "@/components/credit-hub/system/CHQueryProvider";

export const metadata = {
  title: "Credit Hub",
  description: "Where credit decisions are forged",
};

/** Fonts + `.forge-app` now live in {@link GlobalForgeAppShell}. Query client stays scoped to forge routes. */
export default function ForgeRootLayout({ children }: { children: React.ReactNode }) {
  return <CHQueryProvider>{children}</CHQueryProvider>;
}
