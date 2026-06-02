import type { Finding } from "@/types/governance";
import { SEVERITY_ORDER, SEVERITY_COLORS, CENTINELA_LABELS } from "@/types/governance";
import { DataTable, type DataTableColumn } from "@/components/forge/ui/DataTable";
import { ShieldAlert } from "lucide-react";

interface Props {
  findings: Finding[];
}

function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;
  return `...${path.slice(-(maxLength - 3))}`;
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    if (a.severity !== b.severity) {
      return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function FindingsTable({ findings }: Props) {
  if (findings.length === 0) {
    return (
      <div className="rounded-forge-md border border-emerald-200 bg-emerald-50/80 p-6 text-center">
        <p className="font-medium text-emerald-800">No critical findings detected. System healthy.</p>
      </div>
    );
  }

  const sorted = sortFindings(findings);

  const columns: DataTableColumn<Finding>[] = [
    {
      id: "severity",
      header: "Severidad",
      cell: (f) => (
        <span className={`rounded px-2 py-1 text-xs font-bold ${SEVERITY_COLORS[f.severity]}`}>
          {f.severity}
        </span>
      ),
    },
    {
      id: "centinela",
      header: "Centinela",
      cell: (f) => <span className="text-forge-sm text-forgeGray-600">{CENTINELA_LABELS[f.centinela]}</span>,
    },
    {
      id: "title",
      header: "Título",
      cell: (f) => (
        <span className="line-clamp-1 font-medium text-forgeGray-800" title={f.title}>
          {f.title}
        </span>
      ),
    },
    {
      id: "file",
      header: "Archivo:Línea",
      cell: (f) => (
        <span className="font-mono text-xs text-forgeGray-600">
          {f.file_path
            ? `${truncatePath(f.file_path)}${f.line_number != null ? `:${f.line_number}` : ""}`
            : "—"}
        </span>
      ),
    },
    {
      id: "recommendation",
      header: "Recomendación",
      cell: (f) => (
        <span className="line-clamp-1 text-forge-sm text-forgeGray-600" title={f.recommendation}>
          {f.recommendation}
        </span>
      ),
    },
    {
      id: "blocking",
      header: "Blocking",
      cell: (f) =>
        f.blocking ? (
          <ShieldAlert className="h-4 w-4 text-rose-600" aria-label="Blocking" />
        ) : (
          <span className="text-forgeGray-300">—</span>
        ),
    },
  ];

  return (
    <DataTable
      rows={sorted}
      columns={columns}
      getRowId={(f) => f.id}
      emptyLabel="No findings"
    />
  );
}

/** Exported for unit tests. */
export { sortFindings };
