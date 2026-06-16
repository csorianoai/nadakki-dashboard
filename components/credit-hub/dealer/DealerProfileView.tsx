"use client";

import { useState } from "react";
import { Lock, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSections } from "@/components/credit-hub/dealer/sections/ProfileSections";
import type { DealerProfileViewProps } from "@/lib/credit-hub/types/dealer-views";

export function DealerProfileView({ email, institutionName, roleLabel, locale }: DealerProfileViewProps) {
  const { tenantName } = useAuth();
  const [displayName, setDisplayName] = useState(tenantName !== "—" ? tenantName : "");
  const [phone, setPhone] = useState("");
  const resolvedEmail = email || "—";

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 26, letterSpacing: "-0.01em" }}>
          Perfil
        </h1>
        <p style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 6 }}>
          {institutionName} · {roleLabel || "Asesor de piso"}
        </p>
      </div>

      <ProfileSections
        locale={locale}
        displayName={displayName}
        email={resolvedEmail}
        phone={phone}
        institutionName={institutionName}
        onDisplayNameChange={setDisplayName}
        onPhoneChange={setPhone}
      />

      <div className="ch-card mt-4 p-4">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 17, marginBottom: 12 }}>
          Seguridad
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            className="ch-btn ch-btn-secondary min-h-[44px] w-full justify-start"
            disabled
            title="Próximamente"
          >
            <Lock className="h-4 w-4" aria-hidden />
            Cambiar contraseña
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ch-text-3)" }}>Próximamente</span>
          </button>
          <button
            type="button"
            className="ch-btn ch-btn-secondary min-h-[44px] w-full justify-start"
            disabled
            title="Próximamente"
          >
            <Shield className="h-4 w-4" aria-hidden />
            Autenticación en dos pasos (2FA)
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ch-text-3)" }}>Próximamente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
