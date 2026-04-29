export function LegalDisclaimer({ variant = "banner" }: { variant?: "banner" | "compact" }) {
  const text =
    "Esta plataforma provee asistencia legal automatizada. Cada respuesta requiere revisión obligatoria por abogado autorizado antes de tomar acción legal.";

  if (variant === "compact") {
    return (
      <p className="text-xs text-amber-700 mt-2 italic">
        <span aria-hidden="true">⚠️ </span>
        {text}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <strong>Aviso legal:</strong> {text}
    </div>
  );
}
