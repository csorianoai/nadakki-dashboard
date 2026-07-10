"use client";

import { useEffect } from "react";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import {
  computeVehicleDeclarationHash,
  vehicleDeclarationComplete,
  vehicleDeclarationHasVisibleAlert,
  vehicleDeclarationQuestionsAnswered,
} from "@/lib/credit-hub/dealer/vehicle-declaration";

type DeclPatch = Partial<ApplicationFormData>;

function RadioRow({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-2" data-testid={`vehicle-decl-${name}`}>
      <legend className="text-forge-sm font-medium text-forgeGray-800">{label}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2 text-forge-sm text-forgeGray-700">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 border-forgeGray-300 text-forgeBrand-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function VehicleDeclarationSection({
  formData,
  patchForm,
}: {
  formData: ApplicationFormData;
  patchForm: (patch: DeclPatch) => void;
}) {
  const showAlert = vehicleDeclarationHasVisibleAlert(formData);
  const complete = vehicleDeclarationComplete(formData);

  useEffect(() => {
    if (!vehicleDeclarationQuestionsAnswered(formData) || formData.vehicle_decl_signature_name.trim().length < 3) return;
    let cancelled = false;
    void (async () => {
      const hash = await computeVehicleDeclarationHash(formData);
      if (cancelled) return;
      patchForm({
        vehicle_decl_hash: hash,
        vehicle_decl_signed_at: formData.vehicle_decl_signed_at || new Date().toISOString(),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    formData.vehicle_decl_perdida_total,
    formData.vehicle_decl_accidentes,
    formData.vehicle_decl_gravamenes,
    formData.vehicle_decl_titulo_vendedor,
    formData.vehicle_decl_km_coincide,
    formData.vehicle_decl_signature_name,
    formData.vehicle_decl_signed_at,
    patchForm,
  ]);

  return (
    <section
      className="mt-6 space-y-4 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4"
      data-testid="vehicle-declaration-section"
    >
      <div>
        <h3 className="font-display text-forge-lg font-semibold text-forgeGray-800">Declaración del dealer sobre el vehículo</h3>
        <p className="mt-1 text-forge-xs text-forgeGray-500">Todas las preguntas son obligatorias para continuar.</p>
      </div>

      <RadioRow
        name="perdida_total"
        label="¿Este vehículo ha sido declarado pérdida total por alguna aseguradora?"
        value={formData.vehicle_decl_perdida_total}
        options={[
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
        ]}
        onChange={(v) => patchForm({ vehicle_decl_perdida_total: v as ApplicationFormData["vehicle_decl_perdida_total"] })}
      />
      <RadioRow
        name="accidentes"
        label="¿Ha tenido accidentes reportados?"
        value={formData.vehicle_decl_accidentes}
        options={[
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
          { value: "unknown", label: "No sé" },
        ]}
        onChange={(v) => patchForm({ vehicle_decl_accidentes: v as ApplicationFormData["vehicle_decl_accidentes"] })}
      />
      <RadioRow
        name="gravamenes"
        label="¿Tiene gravámenes, embargos o prendas vigentes?"
        value={formData.vehicle_decl_gravamenes}
        options={[
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
        ]}
        onChange={(v) => patchForm({ vehicle_decl_gravamenes: v as ApplicationFormData["vehicle_decl_gravamenes"] })}
      />
      <RadioRow
        name="titulo_vendedor"
        label="¿El título de propiedad está a nombre del vendedor actual?"
        value={formData.vehicle_decl_titulo_vendedor}
        options={[
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
        ]}
        onChange={(v) => patchForm({ vehicle_decl_titulo_vendedor: v as ApplicationFormData["vehicle_decl_titulo_vendedor"] })}
      />
      <RadioRow
        name="km_coincide"
        label="¿El kilometraje declarado coincide con el odómetro actual del vehículo?"
        value={formData.vehicle_decl_km_coincide}
        options={[
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
        ]}
        onChange={(v) => patchForm({ vehicle_decl_km_coincide: v as ApplicationFormData["vehicle_decl_km_coincide"] })}
      />

      {showAlert ? (
        <p
          role="status"
          data-testid="vehicle-declaration-alert"
          className="rounded-forge-md border border-amber-200 bg-amber-50 px-3 py-2 text-forge-sm text-amber-900"
        >
          Esta respuesta será visible para las instituciones financieras que evalúen esta solicitud.
        </p>
      ) : null}

      <p className="text-forge-xs text-forgeGray-600">
        Al continuar, declaro bajo juramento que la información proporcionada sobre este vehículo es verdadera y completa. Entiendo que
        cualquier declaración falsa puede tener consecuencias legales.
      </p>

      <ForgeInput
        label="Firma digital del dealer (nombre completo) *"
        value={formData.vehicle_decl_signature_name}
        onChange={(e) => patchForm({ vehicle_decl_signature_name: e.target.value })}
        placeholder="Nombre y apellido del dealer"
      />
      {formData.vehicle_decl_signed_at ? (
        <p className="text-forge-xs text-forgeGray-500">
          Fecha de firma: {new Date(formData.vehicle_decl_signed_at).toLocaleString("es-DO")}
        </p>
      ) : null}

      {!complete ? (
        <p className="text-forge-sm text-forgeGray-600" role="status">
          Responde las 5 preguntas y firma con tu nombre completo para continuar.
        </p>
      ) : null}
    </section>
  );
}
