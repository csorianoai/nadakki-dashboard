import { Button } from "@/components/forge/ui/Button";
import { EmptyState as ForgeEmptyState } from "@/components/forge/ui/EmptyState";
import { ShieldCheck } from "lucide-react";

interface Props {
  onRun: () => void;
  isRunning: boolean;
}

export function GovernanceEmptyState({ onRun, isRunning }: Props) {
  return (
    <ForgeEmptyState
      icon={<ShieldCheck />}
      title="Sin reportes de governance"
      description="Aún no se ha generado ningún reporte. Ejecuta un check manual para crear el primero."
      action={
        <Button variant="primary" onClick={onRun} disabled={isRunning} loading={isRunning}>
          {isRunning ? "Ejecutando…" : "Run Governance Check"}
        </Button>
      }
    />
  );
}
