import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";

export default function CockpitFinanceRegistryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">Registro de profesiones y entidades</p>
      </header>
      <FinanceSubNav />
      <p className="rounded-xl border border-cockpit-border bg-cockpit-surface p-6 text-sm text-cockpit-muted">
        Registro CRUD — pendiente F4/F5.
      </p>
    </div>
  );
}
