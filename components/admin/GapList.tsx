import { ListTodo } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

type GapListProps = {
  gaps: string[];
  title?: string;
  emptyMessage?: string;
};

export default function GapList({
  gaps,
  title = "Activation gaps",
  emptyMessage = "No activation_gaps returned by backend.",
}: GapListProps) {
  return (
    <GlassCard className="p-5 border border-amber-500/20 bg-amber-500/5">
      <h3 className="text-sm font-semibold text-amber-200 mb-3 flex items-center gap-2">
        <ListTodo className="w-4 h-4" />
        {title}
      </h3>
      {gaps.length > 0 ? (
        <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1">
          {gaps.map((gap, index) => (
            <li key={`${gap}-${index}`}>{gap}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 m-0">{emptyMessage}</p>
      )}
    </GlassCard>
  );
}
