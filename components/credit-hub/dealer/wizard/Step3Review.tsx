"use client";

import { useState } from "react";
import { CheckCircle, DollarSign, XCircle } from "lucide-react";
import { ForgeButton } from "../../primitives/ForgeButton";
import { ForgeInput } from "../../primitives/ForgeInput";
import type { ApplicationFormData } from "./WizardContainer";

interface Step3Props {
  data: ApplicationFormData;
  onChange: <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => void;
  onSubmit: (status: "draft" | "submitted") => void;
  submitStatus: "idle" | "submitting" | "success" | "error";
}

function cleanDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [first, ...rest] = cleaned.split(".");
  return rest.length ? `${first}.${rest.join("")}` : first;
}

export function Step3Review({ data, onChange, onSubmit, submitStatus }: Step3Props) {
  const [submitMode, setSubmitMode] = useState<"draft" | "submitted">("submitted");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-forge-text">Financiamiento y Resumen</h2>
        <p className="mt-1 text-forge-text-muted">Define el monto y revisa los datos antes de enviar.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ForgeInput
          label="Monto solicitado"
          type="text"
          inputMode="decimal"
          placeholder="500000"
          value={data.requested_amount}
          onChange={(event) => onChange("requested_amount", cleanDecimalInput(event.target.value))}
          leftIcon={<DollarSign className="h-4 w-4" />}
          helperText="En pesos dominicanos"
        />

        <ForgeInput
          label="Cuota inicial"
          type="text"
          inputMode="decimal"
          placeholder="100000"
          value={data.down_payment}
          onChange={(event) => onChange("down_payment", cleanDecimalInput(event.target.value))}
          leftIcon={<DollarSign className="h-4 w-4" />}
          helperText="Opcional"
        />
      </div>

      <div className="space-y-3 rounded-xl bg-forge-surface-elevated p-5">
        <h3 className="font-semibold text-forge-text">Resumen</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-forge-text-muted">Cliente:</span>
            <span className="font-medium text-forge-text">{data.applicant_full_name || "—"}</span>
          </div>

          {data.applicant_email && (
            <div className="flex justify-between gap-4">
              <span className="text-forge-text-muted">Email:</span>
              <span className="text-forge-text">{data.applicant_email}</span>
            </div>
          )}

          {(data.vehicle_year || data.vehicle_make || data.vehicle_model) && (
            <div className="flex justify-between gap-4">
              <span className="text-forge-text-muted">Vehículo:</span>
              <span className="text-forge-text">{[data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(" ")}</span>
            </div>
          )}

          {data.requested_amount && (
            <div className="flex justify-between gap-4 border-t border-forge-border pt-2">
              <span className="text-forge-text-muted">Monto:</span>
              <span className="font-mono font-bold text-forge-text">RD$ {Number(data.requested_amount).toLocaleString("es-DO")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-forge-border p-3 transition-colors hover:border-forge-border-hover">
          <input
            type="radio"
            name="submit_mode"
            value="submitted"
            checked={submitMode === "submitted"}
            onChange={() => setSubmitMode("submitted")}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-forge-text">Enviar ahora</p>
            <p className="text-sm text-forge-text-muted">La solicitud será procesada inmediatamente.</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-forge-border p-3 transition-colors hover:border-forge-border-hover">
          <input type="radio" name="submit_mode" value="draft" checked={submitMode === "draft"} onChange={() => setSubmitMode("draft")} className="mt-1" />
          <div>
            <p className="font-medium text-forge-text">Guardar como borrador</p>
            <p className="text-sm text-forge-text-muted">Podrás continuarla más tarde.</p>
          </div>
        </label>
      </div>

      <ForgeButton
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => onSubmit(submitMode)}
        disabled={submitStatus === "submitting" || submitStatus === "success"}
        loading={submitStatus === "submitting"}
        leftIcon={
          submitStatus === "success" ? <CheckCircle className="h-5 w-5" /> : submitStatus === "error" ? <XCircle className="h-5 w-5" /> : undefined
        }
      >
        {submitStatus === "success"
          ? "¡Creada exitosamente!"
          : submitStatus === "error"
            ? "Error - Intentar de nuevo"
            : submitStatus === "submitting"
              ? "Creando..."
              : submitMode === "draft"
                ? "Guardar Borrador"
                : "Crear Solicitud"}
      </ForgeButton>
    </div>
  );
}
