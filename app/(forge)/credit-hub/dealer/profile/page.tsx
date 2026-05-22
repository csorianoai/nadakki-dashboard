"use client";

import { User } from "lucide-react";
import { EmptyState } from "@/components/forge";

export default function DealerProfilePage() {
  return (
    <div className="px-4 pt-6 pb-5 md:px-8 md:pt-8 md:pb-8">
      <h1 className="font-display text-forge-xl font-semibold text-forgeGray-900 mb-6">
        Perfil
      </h1>
      <EmptyState
        titleLevel={2}
        icon={<User />}
        title="Perfil del dealer"
        description="La configuraci&oacute;n de tu perfil estar&aacute; disponible pr&oacute;ximamente."
      />
    </div>
  );
}
