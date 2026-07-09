"use client";

import { useState } from "react";
import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import {
  isSecurityEndpointUnavailable,
  postPreScreen,
  postVerifyIdentity,
  type IdentityVerificationStatus,
  type PreScreenStatus,
} from "@/lib/credit-hub/api/securityClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

type Patch = Partial<ApplicationFormData>;

function Toggle({
  checked,
  disabled,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-3 ${disabled ? "opacity-50" : ""}`}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9 rounded-full accent-forgeBrand-600"
      />
      <span className="text-forge-sm font-medium text-forgeGray-800">{label}</span>
    </label>
  );
}

function IdentityResult({ status, detail }: { status: string; detail?: string }) {
  if (status === "UNAVAILABLE") {
    return <p className="text-forge-sm text-forgeGray-500">Servicio disponible próximamente</p>;
  }
  if (status === "VERIFIED") {
    return <p className="text-forge-sm text-green-700">✓ Identidad verificada</p>;
  }
  if (status === "MISMATCH") {
    return (
      <p className="text-forge-sm text-amber-800">
        ⚠ Datos no coinciden — revisar{detail ? `: ${detail}` : ""}
      </p>
    );
  }
  return <p className="text-forge-sm text-forgeGray-500">No se pudo verificar</p>;
}

function PreScreenResult({ status }: { status: string }) {
  if (status === "UNAVAILABLE") {
    return <p className="text-forge-sm text-forgeGray-500">Servicio disponible próximamente</p>;
  }
  if (status === "ELIGIBLE") return <p className="text-forge-sm text-green-700">🟢 Elegible para envío</p>;
  if (status === "ELIGIBLE_WITH_RESERVATIONS") {
    return <p className="text-forge-sm text-amber-800">🟡 Elegible con reservas</p>;
  }
  if (status === "NOT_ELIGIBLE") {
    return <p className="text-forge-sm text-red-700">🔴 No elegible — recomendar al solicitante regularizar</p>;
  }
  return null;
}

export function SecurityVerificationToggles({
  formData,
  patchForm,
  applicationId,
}: {
  formData: ApplicationFormData;
  patchForm: (patch: Patch) => void;
  applicationId: string;
}) {
  const { apiTenantId } = useTenant();
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [loadingPrescreen, setLoadingPrescreen] = useState(false);
  const idUploaded = Boolean(formData.document_files_ready?.id_front);
  const canCallApi = Boolean(apiTenantId && applicationId.trim());

  const runIdentity = async (enabled: boolean) => {
    patchForm({ security_identity_enabled: enabled });
    if (!enabled) {
      patchForm({ security_identity_status: "", security_identity_detail: "" });
      return;
    }
    if (!canCallApi) {
      patchForm({ security_identity_status: "UNAVAILABLE" });
      return;
    }
    setLoadingIdentity(true);
    try {
      const result = await postVerifyIdentity({ tenantId: apiTenantId!, applicationId });
      patchForm({
        security_identity_status: result.status,
        security_identity_detail: result.detail ?? result.checks?.map((c) => c.message).filter(Boolean).join("; "),
      });
    } catch (err) {
      patchForm({
        security_identity_status: isSecurityEndpointUnavailable(err) ? "UNAVAILABLE" : "UNVERIFIED",
        security_identity_detail: err instanceof Error ? err.message : "",
      });
    } finally {
      setLoadingIdentity(false);
    }
  };

  const runPrescreen = async (enabled: boolean) => {
    patchForm({ security_prescreen_enabled: enabled });
    if (!enabled) {
      patchForm({ security_prescreen_status: "" });
      return;
    }
    if (!canCallApi) {
      patchForm({ security_prescreen_status: "UNAVAILABLE" });
      return;
    }
    setLoadingPrescreen(true);
    try {
      const result = await postPreScreen({ tenantId: apiTenantId!, applicationId });
      patchForm({ security_prescreen_status: result.status });
    } catch (err) {
      patchForm({
        security_prescreen_status: isSecurityEndpointUnavailable(err) ? "UNAVAILABLE" : ("NOT_ELIGIBLE" as PreScreenStatus),
      });
    } finally {
      setLoadingPrescreen(false);
    }
  };

  return (
    <section
      data-testid="security-verification-toggles"
      className="space-y-4 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4"
    >
      <h3 className="text-forge-sm font-semibold text-forgeGray-800">Servicios opcionales de verificación</h3>

      <div className="space-y-2">
        <Toggle
          id="toggle-verify-identity"
          label="Verificar identidad del solicitante"
          checked={formData.security_identity_enabled}
          disabled={!idUploaded || loadingIdentity}
          onChange={(v) => void runIdentity(v)}
        />
        <p className="text-forge-xs text-forgeGray-500">
          Compara los datos del formulario con la cédula subida. Aumenta la confianza del banco en esta solicitud.
        </p>
        {!idUploaded ? (
          <p className="text-forge-xs text-forgeGray-500" title="Sube la cédula primero">
            Sube la cédula primero para habilitar esta verificación.
          </p>
        ) : null}
        {formData.security_identity_status ? (
          <IdentityResult status={formData.security_identity_status} detail={formData.security_identity_detail} />
        ) : null}
      </div>

      <div className="space-y-2 border-t border-forgeGray-200 pt-4">
        <Toggle
          id="toggle-pre-screen"
          label="Consultar elegibilidad crediticia"
          checked={formData.security_prescreen_enabled}
          disabled={loadingPrescreen}
          onChange={(v) => void runPrescreen(v)}
        />
        <p className="text-forge-xs text-forgeGray-500">Verifica la situación crediticia antes de enviar.</p>
        {formData.security_prescreen_status ? <PreScreenResult status={formData.security_prescreen_status} /> : null}
      </div>
    </section>
  );
}
