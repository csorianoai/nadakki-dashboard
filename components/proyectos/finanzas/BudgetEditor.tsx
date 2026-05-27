"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/forge";
import { updateBudget } from "@/app/hooks/useProyectos";
import type { BudgetSnapshot } from "@/types/finanzas";

export function BudgetEditor({
  tenantId,
  projectId,
  budget,
  onSaved,
}: {
  tenantId: string;
  projectId: string;
  budget: BudgetSnapshot;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    envelope_usd: budget.envelope_usd,
    capex_usd: budget.capex_usd,
    opex_usd: budget.opex_usd,
    contingencia_usd: budget.contingencia_usd,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateBudget(tenantId, projectId, form);
      toast.success("Presupuesto actualizado");
      onSaved();
    } catch (e) {
      toast.error("Error al guardar", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(
        [
          ["envelope_usd", "Presupuesto total (USD)"],
          ["capex_usd", "CAPEX (USD)"],
          ["opex_usd", "OPEX (USD)"],
          ["contingencia_usd", "Contingencia (USD)"],
        ] as const
      ).map(([key, label]) => (
        <Input
          key={key}
          label={label}
          type="number"
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) || 0 }))}
          disabled={saving}
        />
      ))}
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="button" disabled={saving} onClick={() => void save()}>
          Guardar presupuesto
        </Button>
      </div>
    </div>
  );
}
