import { Button } from "@/components/forge/ui/Button";
import { RefreshCw } from "lucide-react";

interface Props {
  onRun: () => void;
  isRunning: boolean;
  progressSeconds: number;
  error: Error | null;
}

export function RunCheckButton({ onRun, isRunning, progressSeconds }: Props) {
  if (isRunning) {
    return (
      <Button variant="secondary" disabled loading>
        Ejecutando centinelas ({progressSeconds}s)
      </Button>
    );
  }

  return (
    <Button variant="primary" onClick={onRun} leadingIcon={<RefreshCw className="h-4 w-4" />}>
      Run Governance Check
    </Button>
  );
}
