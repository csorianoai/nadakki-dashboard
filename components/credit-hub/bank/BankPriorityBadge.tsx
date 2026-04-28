import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";

export function BankPriorityBadge({ priority }: { priority: "ALTA" | "MEDIA" | "BAJA" }) {
  const tone = priority === "ALTA" ? "success" : priority === "MEDIA" ? "warning" : "neutral";
  return <ForgeBadge tone={tone}>Prioridad {priority}</ForgeBadge>;
}
