"use client";

import { Mail, Phone, User } from "lucide-react";
import { ForgeInput } from "../../primitives/ForgeInput";
import type { ApplicationFormData } from "./WizardContainer";

interface Step1Props {
  data: ApplicationFormData;
  onChange: <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => void;
}

export function Step1Applicant({ data, onChange }: Step1Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-forge-text">Información del Cliente</h2>
        <p className="mt-1 text-forge-text-muted">Comencemos con los datos básicos del solicitante.</p>
      </div>

      <ForgeInput
        label="Nombre completo *"
        placeholder="Ej: Juan Pérez"
        value={data.applicant_name}
        onChange={(event) => onChange("applicant_name", event.target.value)}
        leftIcon={<User className="h-4 w-4" />}
        required
        autoFocus
        helperText="Mínimo 2 caracteres"
      />

      <ForgeInput
        label="Email"
        type="email"
        placeholder="cliente@ejemplo.com"
        value={data.applicant_email}
        onChange={(event) => onChange("applicant_email", event.target.value)}
        leftIcon={<Mail className="h-4 w-4" />}
      />

      <ForgeInput
        label="Teléfono"
        type="tel"
        placeholder="+1 809 555 0000"
        value={data.applicant_phone}
        onChange={(event) => onChange("applicant_phone", event.target.value)}
        leftIcon={<Phone className="h-4 w-4" />}
      />
    </div>
  );
}
