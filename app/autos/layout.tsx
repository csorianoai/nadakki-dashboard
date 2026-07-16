import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { TopNav } from "@/components/nav/TopNav";

export default function AutosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AutosPortalShell>
      <TopNav />
      {children}
    </AutosPortalShell>
  );
}
