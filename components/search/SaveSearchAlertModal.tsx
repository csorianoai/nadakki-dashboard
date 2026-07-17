"use client";

import { useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FixedModal } from "@/components/system/ModalRoot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFilterPreviewLabels } from "@/lib/active-filter-chips";
import type { FilterState } from "@/lib/search-types";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp (recomendado en RD)" },
  { id: "email", label: "Email" },
  { id: "inapp", label: "Notificación in-app" },
] as const;

const FREQUENCIES = [
  { id: "instant", label: "Inmediata" },
  { id: "daily", label: "Diaria (resumen)" },
  { id: "weekly", label: "Semanal (resumen)" },
] as const;

export function SaveSearchAlertModal({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FilterState;
}) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<string[]>(["whatsapp", "inapp"]);
  const [frequency, setFrequency] = useState("instant");

  const preview = getFilterPreviewLabels(state);

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleActivate = () => {
    toast.success(
      name.trim()
        ? `Alerta AI "${name.trim()}" activada. Te avisamos cuando haya coincidencias.`
        : "Alerta AI activada. Te avisamos cuando haya coincidencias.",
    );
    onOpenChange(false);
  };

  return (
    <FixedModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Crear Alerta AI"
      titleId="save-search-modal-title"
      icon={<Sparkles className="h-5 w-5 text-brand" aria-hidden />}
      subtitle="Recibe notificaciones cuando aparezca un vehículo compatible"
      footer={
        <div className="px-5 py-4">
          <Button variant="brand" className="w-full font-manrope font-semibold" onClick={handleActivate}>
            <Bell className="mr-2 h-4 w-4" aria-hidden />
            Activar Alerta AI
          </Button>
        </div>
      }
    >
      <div className="min-h-0 flex-1 space-y-4 px-5 py-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">
            Filtros que se guardarán
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {preview.map((label) => (
              <li
                key={label}
                className="rounded-full border border-nk-border bg-nk-surface-2 px-2.5 py-1 text-xs font-medium text-nk-fg"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="alert-name" className="text-sm font-medium text-nk-fg">
            Nombra tu alerta
          </label>
          <Input
            id="alert-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Mi SUV ideal"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-nk-fg">Canal de notificación</p>
          {CHANNELS.map((ch) => (
            <label key={ch.id} className="flex items-center gap-2 text-sm text-nk-fg-muted">
              <input
                type="checkbox"
                checked={channels.includes(ch.id)}
                onChange={() => toggleChannel(ch.id)}
                className="accent-brand"
              />
              {ch.label}
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-nk-fg">Frecuencia</p>
          {FREQUENCIES.map((freq) => (
            <label key={freq.id} className="flex items-center gap-2 text-sm text-nk-fg-muted">
              <input
                type="radio"
                name="alert-frequency"
                checked={frequency === freq.id}
                onChange={() => setFrequency(freq.id)}
                className="accent-brand"
              />
              {freq.label}
            </label>
          ))}
        </div>
      </div>
    </FixedModal>
  );
}
