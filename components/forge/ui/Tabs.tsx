"use client";

import { useId, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
  panel: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabDef[];
  value: string;
  onValueChange: (id: string) => void;
  className?: string;
  /** Visual style — both meet Forge density; `pills` for filters, `line` for settings. */
  variant?: "line" | "pills";
}

export function Tabs({ tabs, value, onValueChange, className, variant = "line" }: TabsProps) {
  const baseId = useId();
  const active = useMemo(() => tabs.find((t) => t.id === value) ?? tabs[0], [tabs, value]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "flex flex-wrap gap-1",
          variant === "line" && "border-b border-forgeInk-200",
          variant === "pills" && "rounded-forge-md bg-forgeSurface-sunken p-1"
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onValueChange(tab.id)}
              className={cn(
                "rounded-forge-sm px-3 py-2 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)] ease-out",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                variant === "line" &&
                  (selected
                    ? "-mb-px border-b-2 border-forgeBrand-500 text-forgeBrand-700"
                    : "-mb-px border-b-2 border-forgeInk-200 text-forgeInk-500 hover:border-forgeInk-300 hover:text-forgeInk-700"),
                variant === "pills" &&
                  (selected ? "bg-forgeSurface-card text-forgeInk-800 shadow-forge-xs" : "text-forgeInk-600 hover:text-forgeInk-800"),
                tab.disabled &&
                  "cursor-not-allowed !border-transparent bg-transparent text-forgeInk-300 hover:!border-transparent hover:bg-transparent hover:text-forgeInk-300"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="min-h-[120px] rounded-forge-md border border-forgeInk-100 bg-forgeSurface-card p-4 text-forge-sm text-forgeInk-800"
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
