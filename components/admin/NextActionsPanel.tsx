import { ArrowRightCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

type NextActionsPanelProps = {
  actions: string[];
  title?: string;
  emptyMessage?: string;
};

export default function NextActionsPanel({
  actions,
  title = "Next actions",
  emptyMessage = "No next_actions provided by backend.",
}: NextActionsPanelProps) {
  return (
    <GlassCard className="p-5 border border-cyan-500/20 bg-cyan-500/5">
      <h3 className="text-sm font-semibold text-cyan-200 mb-3 flex items-center gap-2">
        <ArrowRightCircle className="w-4 h-4" />
        {title}
      </h3>
      {actions.length > 0 ? (
        <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
          {actions.map((action, index) => (
            <li key={`${action}-${index}`}>{action}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 m-0">{emptyMessage}</p>
      )}
    </GlassCard>
  );
}
