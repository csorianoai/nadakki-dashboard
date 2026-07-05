import type { NautaCatalogStatus } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";

const LABELS: Record<NautaCatalogStatus, string> = {
  prioridad: S.employee.pill.prioridad,
  listo: S.employee.pill.listo,
  laboratorio: S.employee.pill.laboratorio,
  concepto: S.employee.pill.concepto,
};

export function StatusPill({ status }: { status: NautaCatalogStatus }) {
  const showDot = status === "prioridad";
  return (
    <span className={`pill ${status}`}>
      {showDot ? <span className="dot" aria-hidden /> : null}
      {LABELS[status]}
    </span>
  );
}
