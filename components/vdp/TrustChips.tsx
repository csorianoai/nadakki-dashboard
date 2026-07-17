import { Check, Shield, Star } from "lucide-react";

export function TrustChips() {
  const chips = [
    { icon: Check, label: "Dealer Verificado", className: "text-nk-success" },
    { icon: Shield, label: "VIN validado", className: "text-brand" },
    { icon: Star, label: "15 usuarios: precio justo", className: "text-nk-warning" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ icon: Icon, label, className }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-nk-border bg-nk-surface px-3 py-1.5 text-xs font-semibold text-nk-fg"
        >
          <Icon className={`h-3.5 w-3.5 ${className}`} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
