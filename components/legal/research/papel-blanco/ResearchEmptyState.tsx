"use client";

const EXAMPLE_QUERIES = [
  {
    area: "Laboral",
    question:
      "¿Cuántos días de preaviso y auxilio de cesantía corresponden a un trabajador con 8 años de antigüedad?",
  },
  {
    area: "Laboral",
    question: "¿Cómo se calculan las vacaciones no disfrutadas al terminar la relación laboral?",
  },
  {
    area: "Civil",
    question: "¿Es válida una cláusula penal del 50% en un contrato de préstamo entre particulares?",
  },
  {
    area: "AML",
    question: "¿Qué obligaciones de debida diligencia aplican bajo la Ley 155-17?",
  },
] as const;

type Props = {
  onPickQuestion: (q: string) => void;
  onOpenRecent: () => void;
  recentCount: number;
};

export function ResearchEmptyState({ onPickQuestion, onOpenRecent, recentCount }: Props) {
  return (
    <div className="lr-content">
      <span className="lr-empty-badge">Asistente jurídico con citas verificadas</span>
      <h2 className="lr-empty-title">¿Qué necesitas consultar hoy?</h2>
      <p className="lr-empty-sub">
        Consulta normativa y criterios con trazabilidad verificable. Cada respuesta incluye fuentes citadas y
        metadatos de auditoría.
      </p>

      <div className="lr-example-grid" role="list">
        {EXAMPLE_QUERIES.map(({ area, question }) => (
          <button
            key={question}
            type="button"
            className="lr-example-card"
            role="listitem"
            aria-label={`Ejemplo ${area}: ${question}`}
            onClick={() => onPickQuestion(question)}
          >
            <span className="lr-example-area">{area}</span>
            <p className="lr-example-q">{question}</p>
          </button>
        ))}
      </div>

      {recentCount > 0 ? (
        <button type="button" className="lr-recent-link" onClick={onOpenRecent}>
          Ver tus Consultas recientes · {recentCount} →
        </button>
      ) : null}
    </div>
  );
}
