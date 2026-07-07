import { useMemo, useState } from "react";
import type { NautaEnrichedEmployee, NautaExpedienteView } from "@/lib/nauta/employeeModel";
import { DEPT_ORDER, NAUTA_BUNDLES } from "@/lib/nauta/catalogMeta";
import { NAUTA_E16_DEFAULT_TASK, NAUTA_FREEFORM_ROLE_ID } from "@/lib/nauta/freeformConfig";
import { NAUTA_LIVE_DEFAULT_TASK } from "@/lib/nauta/liveConfig";
import { NautaLiveView } from "@/lib/nauta/components/NautaLiveView";
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

function resolveLiveTaskName(selected: NautaEnrichedEmployee | null): string {
  if (selected?.allows_freeform) return NAUTA_E16_DEFAULT_TASK;
  return NAUTA_LIVE_DEFAULT_TASK;
}

export function PisoView({
  employees,
  mode,
  onModeChange,
  onOpenExpediente,
  onOpenSupervision,
}: {
  employees: NautaEnrichedEmployee[];
  mode: PisoMode;
  onModeChange: (mode: PisoMode) => void;
  onOpenExpediente: (view: NautaExpedienteView) => void;
  onOpenSupervision?: () => void;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(NAUTA_FREEFORM_ROLE_ID);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.role_id === selectedRoleId) ?? null,
    [employees, selectedRoleId],
  );

  const liveTaskName = resolveLiveTaskName(selectedEmployee);
  const showComposer = Boolean(selectedEmployee?.allows_freeform);

  return (
    <>
      <div className="toolbar">
        <h3>{PISO_TITLES[mode]}</h3>
        <span className="spacer" />
        <SegmentedControl mode={mode} onChange={onModeChange} />
      </div>
      {mode !== "planes" ? (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-h">
            <h3>Ejecución live</h3>
            <span className="sp" />
            <span className="sub mono">
              {selectedEmployee ? `${selectedEmployee.role_id} · ${liveTaskName}` : liveTaskName}
            </span>
          </div>
          <div className="panel-b">
            <NautaLiveView
              taskName={liveTaskName}
              allowsFreeform={showComposer}
              variant="panel"
              onOpenSupervision={onOpenSupervision}
            />
          </div>
        </div>
      ) : null}
      <div className={`piso-wrap${mode === "planes" ? " solo" : ""}`}>
        <div>
          {mode === "dept" &&
            DEPT_ORDER.map((deptId) => (
              <DepartmentSection
                key={deptId}
                deptId={deptId}
                employees={employees.filter((e) => e.department_id === deptId)}
                onOpenExpediente={onOpenExpediente}
                selectedRoleId={selectedRoleId}
                onSelectForLive={setSelectedRoleId}
              />
            ))}
          {mode === "estado" && (
            <StatusGroupedSections
              employees={employees}
              onOpenExpediente={onOpenExpediente}
              selectedRoleId={selectedRoleId}
              onSelectForLive={setSelectedRoleId}
            />
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
