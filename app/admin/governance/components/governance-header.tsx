import type { GovernanceReport } from "@/types/governance";
import { STATUS_COLORS, SEVERITY_COLORS } from "@/types/governance";
import { Card } from "@/components/forge/ui/Card";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  if (hr < 24) return `hace ${hr} h`;
  if (day < 7) return `hace ${day} d`;
  return date.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

interface Props {
  report: GovernanceReport;
}

export function GovernanceHeader({ report }: Props) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-forgeGray-500">Estado global</p>
          <div className="mt-1 flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[report.overall_status]}`} />
            <span className="font-semibold text-forgeGray-800">{report.overall_status}</span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-forgeGray-500">Severidad máxima</p>
          <span
            className={`mt-1 inline-block rounded px-2 py-1 text-xs font-bold ${SEVERITY_COLORS[report.max_severity]}`}
          >
            {report.max_severity}
          </span>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-forgeGray-500">Última ejecución</p>
          <p className="mt-1 font-medium text-forgeGray-800">{formatRelativeTime(report.timestamp)}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-forgeGray-500">Ambiente</p>
          <span className="mt-1 inline-block rounded bg-forgeGray-100 px-2 py-1 text-xs text-forgeGray-700">
            {report.environment}
          </span>
        </div>
      </div>
    </Card>
  );
}
