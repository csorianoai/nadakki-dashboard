import { Inbox } from "lucide-react";
import { ForgeCard } from "../primitives/ForgeCard";

interface CHEmptyStateProps {
  title?: string;
  description?: string;
}

export function CHEmptyState({ title = "Sin resultados", description = "—" }: CHEmptyStateProps) {
  return (
    <ForgeCard className="p-12 text-center">
      <Inbox className="mx-auto mb-4 h-10 w-10 text-forge-text-muted" />
      <h2 className="font-display text-xl font-semibold text-forge-text">{title}</h2>
      <p className="mt-2 text-forge-text-muted">{description}</p>
    </ForgeCard>
  );
}
