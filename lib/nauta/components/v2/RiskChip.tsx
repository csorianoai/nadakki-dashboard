import type { NautaRiskLevelKey } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";

const LABELS: Record<NautaRiskLevelKey, string> = {
  bajo: S.employee.risk.bajo,
  medio: S.employee.risk.medio,
  alto: S.employee.risk.alto,
  critico: S.employee.risk.critico,
};

export function RiskChip({ level }: { level: NautaRiskLevelKey }) {
  return <span className={`risk ${level}`}>{LABELS[level]}</span>;
}
