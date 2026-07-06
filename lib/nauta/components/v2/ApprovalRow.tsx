import type { NautaApprovalItem } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";
import { RiskChip } from "./RiskChip";

export function ApprovalRow({
  item,
  onDecide,
}: {
  item: NautaApprovalItem;
  onDecide: (id: string) => void;
}) {
  return (
    <div className="aq-row">
      <div className="badge">{item.role_id}</div>
      <div className="task">
        {item.task}
        <div className="sub">
          <RiskChip level={item.risk} />
          {item.sub}
        </div>
      </div>
      <div className="by">
        {item.employee_label}
        <div className="r">{item.employee_sub}</div>
      </div>
      <div className="ev">◱ {item.hash}</div>
      <div className="act">
        <button type="button" className="btn ghost" onClick={() => onDecide(item.id)}>
          {S.super.btnReview}
        </button>
        <button type="button" className="btn" onClick={() => onDecide(item.id)}>
          {S.super.btnReject}
        </button>
        <button type="button" className="btn primary" onClick={() => onDecide(item.id)}>
          {S.super.btnApprove}
        </button>
      </div>
    </div>
  );
}
