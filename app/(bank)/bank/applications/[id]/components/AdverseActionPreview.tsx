"use client";

export interface AdverseActionPreviewProps {
  visible: boolean;
  acknowledged: boolean;
  onAckChange: (v: boolean) => void;
  disabled?: boolean;
}

/** Preview when adverse action pathway applies (REJECT or counter no-match). */
export function AdverseActionPreview({ visible, acknowledged, onAckChange, disabled }: AdverseActionPreviewProps) {
  if (!visible) return null;
  return (
    <section
      className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 text-forge-sm text-amber-950"
      aria-labelledby="adverse-preview-title"
    >
      <h3 id="adverse-preview-title" className="font-semibold text-amber-950">
        Vista previa de acción adversa / notificación regulatoria
      </h3>
      <p className="mt-2 text-forge-xs leading-relaxed text-amber-950/90">
        El cliente recibirá la carta/notificación configurada por el banco. Verifica códigos de razón y estipulaciones
        antes de enviar. La URL firmada se entregará en la respuesta si aplica.
      </p>
      <label className="mt-3 flex items-start gap-2">
        <input
          type="checkbox"
          disabled={disabled}
          checked={acknowledged}
          onChange={(e) => onAckChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-amber-400"
        />
        <span>Confirmo que procede acción adversa / notificación según política del banco.</span>
      </label>
    </section>
  );
}
