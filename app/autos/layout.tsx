import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { TopNav } from "@/components/nav/TopNav";
import { ConciergeHost } from "@/components/concierge/ConciergeSheet";

export default function AutosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AutosPortalShell>
      <TopNav />
      {children}
      <ConciergeHost />
    </AutosPortalShell>
  );
}
