import type { NautaEnrichedEmployee, NautaExpedienteView } from "@/lib/nauta/employeeModel";
import { DEPT_LABELS, S } from "@/lib/nauta/strings";
import type { NautaCatalogStatus } from "@/lib/nauta/catalogMeta";
import { RiskChip } from "./RiskChip";
import { StatusPill } from "./StatusPill";

const CTA: Record<
  NautaCatalogStatus,
  { variant: "" | "primary" | "ghost"; label: string } | null
> = {
  listo: { variant: "primary", label: S.employee.cta.contratar },
  prioridad: { variant: "primary", label: S.employee.cta.reservar },
  laboratorio: { variant: "", label: S.employee.cta.verPrueba },
  concepto: { variant: "ghost", label: S.employee.cta.reservar },
};

function cardClass(status: NautaCatalogStatus, isStar: boolean, clickable: boolean): string {
  const parts = ["emp", `st-${status}`];
  if (isStar) parts.push("star");
  if (clickable) parts.push("clk");
  return parts.join(" ");
}

export function EmployeeCard({
  employee,
  onOpenExpediente,
}: {
  employee: NautaEnrichedEmployee;
  onOpenExpediente?: (view: NautaExpedienteView) => void;
}) {
  const { role_id, role_name, department_id, catalog_status, risk_level, supervisor, live_line, is_star, expediente } =
    employee;
  const cta = CTA[catalog_status];
  const clickable = Boolean(expediente && onOpenExpediente);

  return (
    <div
      className={cardClass(catalog_status, Boolean(is_star), clickable)}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={(ev) => {
        if (!clickable || !expediente) return;
        if ((ev.target as HTMLElement).closest(".btn")) return;
        onOpenExpediente?.(expediente);
      }}
      onKeyDown={(ev) => {
        if (!clickable || !expediente) return;
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOpenExpediente?.(expediente);
        }
      }}
    >
      {is_star ? <div className="star-tag">{S.employee.starTag}</div> : null}
      <div className="emp-top">
        <div className="badge">{role_id}</div>
        <div className="emp-id">
          <div className="rn">{role_name}</div>
          <div className="cd">
            {role_id} · {DEPT_LABELS[department_id] ?? department_id}
          </div>
        </div>
        <StatusPill status={catalog_status} />
      </div>
      <div className="emp-meta">
        <div className="row">
          <span className="k">{S.employee.riskLabel}</span>
          <RiskChip level={risk_level} />
        </div>
        <div className="row">
          <span className="k">{S.employee.supervisorLabel}</span>
          <span className="v">{supervisor}</span>
        </div>
      </div>
      {live_line ? (
        <div className="emp-live">
          <span className="dot lv" aria-hidden />
          {live_line}
        </div>
      ) : null}
      {cta ? (
        <div className="emp-cta">
          <button type="button" className={`btn ${cta.variant}`.trim()} onClick={(e) => e.stopPropagation()}>
            {cta.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}
