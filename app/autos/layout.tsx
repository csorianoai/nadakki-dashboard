import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { TopNav } from "@/components/nav/TopNav";
import { AutosLayoutClient } from "@/components/autos/AutosLayoutClient";
import { ThemeProvider } from "@/components/system/ThemeProvider";
import { TenantProvider } from "@/components/system/TenantProvider";

export default function AutosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AutosPortalShell>
      <ThemeProvider>
        <TenantProvider>
          <TopNav />
          <AutosLayoutClient>{children}</AutosLayoutClient>
        </TenantProvider>
      </ThemeProvider>
    </AutosPortalShell>
  );
}
