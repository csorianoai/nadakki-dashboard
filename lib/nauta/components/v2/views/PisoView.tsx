import type { NautaEnrichedEmployee, NautaExpedienteView } from "@/lib/nauta/employeeModel";
import { DEPT_ORDER, NAUTA_BUNDLES } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";
import { SegmentedControl, type PisoMode } from "../SegmentedControl";
import { DepartmentSection } from "../DepartmentSection";
import { StatusGroupedSections } from "../StatusGroupSection";
import { LiveActivityColumn } from "../LiveActivityColumn";
import { BundleCard } from "../BundleCard";

const PISO_TITLES: Record<PisoMode, string> = {
  dept: S.toolbar.employees16,
  estado: S.toolbar.byLifecycle,
  planes: S.toolbar.plans,
};

export function PisoView({
  employees,
  mode,
  onModeChange,
  onOpenExpediente,
}: {
  employees: NautaEnrichedEmployee[];
  mode: PisoMode;
  onModeChange: (mode: PisoMode) => void;
  onOpenExpediente: (view: NautaExpedienteView) => void;
}) {
  return (
    <>
      <div className="toolbar">
        <h3>{PISO_TITLES[mode]}</h3>
        <span className="spacer" />
        <SegmentedControl mode={mode} onChange={onModeChange} />
      </div>
      <div className={`piso-wrap${mode === "planes" ? " solo" : ""}`}>
        <div>
          {mode === "dept" &&
            DEPT_ORDER.map((deptId) => (
              <DepartmentSection
                key={deptId}
                deptId={deptId}
                employees={employees.filter((e) => e.department_id === deptId)}
                onOpenExpediente={onOpenExpediente}
              />
            ))}
          {mode === "estado" && (
            <StatusGroupedSections employees={employees} onOpenExpediente={onOpenExpediente} />
          )}
          {mode === "planes" && (
            <div className="plans">
              {NAUTA_BUNDLES.map((plan) => (
                <BundleCard key={plan.department_id} plan={plan} />
              ))}
            </div>
          )}
        </div>
        {mode !== "planes" ? <LiveActivityColumn /> : null}
      </div>
    </>
  );
}
