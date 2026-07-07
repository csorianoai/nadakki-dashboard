import type { NautaEnrichedEmployee, NautaExpedienteView } from "@/lib/nauta/employeeModel";
import { DEPT_COUNTS } from "@/lib/nauta/catalogMeta";
import { DEPT_NAMES, S } from "@/lib/nauta/strings";
import { EmployeeCard } from "./EmployeeCard";

export function DepartmentSection({
  deptId,
  employees,
  onOpenExpediente,
  selectedRoleId,
  onSelectForLive,
}: {
  deptId: string;
  employees: NautaEnrichedEmployee[];
  onOpenExpediente?: (view: NautaExpedienteView) => void;
  selectedRoleId?: string | null;
  onSelectForLive?: (roleId: string) => void;
}) {
  const count = DEPT_COUNTS[deptId] ?? employees.length;
  const deptCode = deptId.toUpperCase();
  const sub =
    deptId === "d1"
      ? S.dept.d1Sub
      : count === 1
        ? S.dept.oneEmployee
        : S.dept.nEmployees(count);

  return (
    <div className="dept">
      <div className="dept-h">
        <span className="dc">{deptCode}</span>
        <h3>{DEPT_NAMES[deptId]}</h3>
        <span className="ct">{sub}</span>
        <span className="rule" />
      </div>
      <div className="grid">
        {employees.map((e) => (
          <EmployeeCard
            key={e.role_id}
            employee={e}
            onOpenExpediente={onOpenExpediente}
            selectedRoleId={selectedRoleId}
            onSelectForLive={onSelectForLive}
          />
        ))}
      </div>
    </div>
  );
}
