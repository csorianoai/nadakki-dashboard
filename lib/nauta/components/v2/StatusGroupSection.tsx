import type { NautaEnrichedEmployee, NautaExpedienteView } from "@/lib/nauta/employeeModel";
import type { NautaCatalogStatus } from "@/lib/nauta/catalogMeta";
import { STATUS_ORDER } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";
import { EmployeeCard } from "./EmployeeCard";

const GROUP_META: Record<
  NautaCatalogStatus,
  { icon: string; title: string; sub: string }
> = {
  prioridad: { icon: "◆", title: S.statusGroup.prioridad, sub: S.statusGroup.prioridadSub },
  listo: { icon: "◔", title: S.statusGroup.listo, sub: S.statusGroup.listoSub },
  laboratorio: { icon: "◑", title: S.statusGroup.laboratorio, sub: S.statusGroup.laboratorioSub },
  concepto: { icon: "○", title: S.statusGroup.concepto, sub: S.statusGroup.conceptoSub },
};

export function StatusGroupSection({
  status,
  employees,
  onOpenExpediente,
  selectedRoleId,
  onSelectForLive,
}: {
  status: NautaCatalogStatus;
  employees: NautaEnrichedEmployee[];
  onOpenExpediente?: (view: NautaExpedienteView) => void;
  selectedRoleId?: string | null;
  onSelectForLive?: (roleId: string) => void;
}) {
  if (employees.length === 0) return null;
  const meta = GROUP_META[status];
  return (
    <div className="dept">
      <div className="dept-h">
        <span className="dc">{meta.icon}</span>
        <h3>{meta.title}</h3>
        <span className="ct">{meta.sub}</span>
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

export function StatusGroupedSections({
  employees,
  onOpenExpediente,
  selectedRoleId,
  onSelectForLive,
}: {
  employees: NautaEnrichedEmployee[];
  onOpenExpediente?: (view: NautaExpedienteView) => void;
  selectedRoleId?: string | null;
  onSelectForLive?: (roleId: string) => void;
}) {
  return (
    <>
      {STATUS_ORDER.map((status) => (
        <StatusGroupSection
          key={status}
          status={status}
          employees={employees.filter((e) => e.catalog_status === status)}
          onOpenExpediente={onOpenExpediente}
          selectedRoleId={selectedRoleId}
          onSelectForLive={onSelectForLive}
        />
      ))}
    </>
  );
}
