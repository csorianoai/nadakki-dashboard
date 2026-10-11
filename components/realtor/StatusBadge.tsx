import { STATUS_EXPLAIN, STATUS_LABEL } from "@/lib/realtor/copy";
import type { DataStatus } from "@/lib/realtor/types";

export function StatusBadge({ status }: { status: DataStatus }) {
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      title={STATUS_EXPLAIN[status]}
      className="inline-block rounded border px-2 py-0.5 text-xs font-semibold"
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
