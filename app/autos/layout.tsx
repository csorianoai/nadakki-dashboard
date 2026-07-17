import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { TopNav } from "@/components/nav/TopNav";
import { AutosLayoutClient } from "@/components/autos/AutosLayoutClient";

export default function AutosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AutosPortalShell>
      <TopNav />
      <AutosLayoutClient>{children}</AutosLayoutClient>
    </AutosPortalShell>
  );
}
