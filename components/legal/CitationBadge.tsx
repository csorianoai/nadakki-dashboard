interface Props {
  citation: string;
  verified: boolean;
}

export function CitationBadge({ citation, verified }: Props) {
  if (verified) {
    return (
      <code
        className="bg-green-100 text-green-900 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
        title="Cita verificada en knowledge pack firmado por abogado"
      >
        <span aria-hidden="true">✓</span> {citation}
      </code>
    );
  }
  return (
    <code
      className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
      title="Cita pendiente de verificación legal — DEMO"
    >
      <span aria-hidden="true">⚠️</span> {citation}
      <span className="text-amber-600 ml-1">(no verificada)</span>
    </code>
  );
}
