import { Search } from "lucide-react";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";

export function BankQueueFilters({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <ForgeInput
        placeholder="Buscar por cliente, dealer o application ID..."
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />
      <div className="rounded-xl bg-forge-surface-elevated px-4 py-3 text-sm text-forge-text-muted">
        Orden: score Forge AI descendente
      </div>
    </div>
  );
}
