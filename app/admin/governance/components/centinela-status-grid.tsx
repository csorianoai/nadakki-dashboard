import type { CentinelaResult } from "@/types/governance";
import { STATUS_COLORS, CENTINELA_LABELS, SEVERITY_COLORS } from "@/types/governance";
import { Card } from "@/components/forge/ui/Card";
import { Code2, Key, Shield, Workflow } from "lucide-react";
import type { CentinelaName } from "@/types/governance";

const CENTINELA_ICONS: Record<CentinelaName, typeof Shield> = {
  seguridad: Shield,
  oauth: Key,
  workflows: Workflow,
  mocks: Code2,
};

interface Props {
  centinelas: CentinelaResult[];
}

export function CentinelaStatusGrid({ centinelas }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {centinelas.map((c) => {
        const Icon = CENTINELA_ICONS[c.nombre];
        return (
          <Card key={c.nombre} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-forgeGray-600" aria-hidden />
                <div>
                  <p className="font-semibold text-forgeGray-800">{CENTINELA_LABELS[c.nombre]}</p>
                  <p className="text-xs text-forgeGray-500">
                    {c.findings_count} hallazgos · {c.duration_ms} ms
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[c.status]}`} />
                  <span className="text-xs font-medium text-forgeGray-700">{c.status}</span>
                </div>
                {c.max_severity !== "NONE" && (
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${SEVERITY_COLORS[c.max_severity]}`}
                  >
                    {c.max_severity}
                  </span>
                )}
              </div>
            </div>
            {c.error_message ? (
              <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-600">{c.error_message}</p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
