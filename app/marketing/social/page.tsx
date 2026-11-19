"use client";

import { useMemo } from "react";
import NavigationBar from "@/components/ui/NavigationBar";
import { useTenant } from "@/contexts/TenantContext";
import { createSocialClient } from "@/lib/social-center/client";
import { detectLang } from "@/lib/social-center/copy";
import { createMockClient } from "@/lib/social-center/mock";
import SocialCenter from "./_components/SocialCenter";

/**
 * Centro Social (B1, C-SOCIAL-D0). El tenant sale del JWT/sesion. Sin backend vivo el panel muestra un estado vacio
 * honesto; los datos de ejemplo solo con NEXT_PUBLIC_SOCIAL_CENTER_DEMO=1 y siempre con el badge DEMO.
 */
export default function SocialMediaPage() {
  const { tenantId } = useTenant();
  const demo = process.env.NEXT_PUBLIC_SOCIAL_CENTER_DEMO === "1";
  const client = useMemo(() => (demo ? createMockClient() : createSocialClient({ tenantId })), [demo, tenantId]);
  const lang = useMemo(() => detectLang(), []);

  return (
    <>
      <NavigationBar backHref="/marketing" />
      <SocialCenter client={client} demo={demo} lang={lang} />
    </>
  );
}
