"use client";

import { Calendar, Car, Hash } from "lucide-react";
import { ForgeInput } from "../../primitives/ForgeInput";
import type { ApplicationFormData } from "./WizardContainer";

interface Step2Props {
  data: ApplicationFormData;
  onChange: <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => void;
}

export function Step2Vehicle({ data, onChange }: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-forge-text">Información del Vehículo</h2>
        <p className="mt-1 text-forge-text-muted">Datos del vehículo (opcional). Puedes saltarlo si aún no lo tienes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ForgeInput
          label="Año"
          type="number"
          min="1900"
          max="2100"
          placeholder="2023"
          value={data.vehicle_year}
          onChange={(event) => onChange("vehicle_year", event.target.value)}
          leftIcon={<Calendar className="h-4 w-4" />}
        />

        <ForgeInput
          label="Marca"
          placeholder="Toyota"
          value={data.vehicle_make}
          onChange={(event) => onChange("vehicle_make", event.target.value)}
          leftIcon={<Car className="h-4 w-4" />}
        />
      </div>

      <ForgeInput label="Modelo" placeholder="Hilux" value={data.vehicle_model} onChange={(event) => onChange("vehicle_model", event.target.value)} />

      <ForgeInput
        label="VIN"
        placeholder="17 caracteres"
        maxLength={17}
        value={data.dealer_supplier}
        onChange={(event) => onChange("dealer_supplier", event.target.value)}
        leftIcon={<Hash className="h-4 w-4" />}
        helperText="Dealer o suplidor"
      />
    </div>
  );
}
