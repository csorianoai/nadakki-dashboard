"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandPaletteAction {
  id: string;
  label: string;
  keywords?: string[];
  icon?: ReactNode;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandPaletteAction[];
  placeholder?: string;
  className?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  placeholder = "Search commands…",
  className,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-forgeSurface-overlay px-4 pt-[12vh]"
      onMouseDown={() => onOpenChange(false)}
    >
      <Command
        className={cn(
          "w-full max-w-lg overflow-hidden rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card shadow-forge-lg",
          className
        )}
        onMouseDown={(e) => e.stopPropagation()}
        shouldFilter
        loop
      >
        <div className="flex items-center gap-2 border-b border-forgeInk-100 px-3">
          <Search className="h-4 w-4 shrink-0 text-forgeInk-400" aria-hidden />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder}
            className="h-11 w-full bg-transparent py-2 text-forge-sm text-forgeInk-800 outline-none placeholder:text-forgeInk-400"
          />
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-forge-sm text-forgeInk-500">No results.</Command.Empty>
          <Command.Group heading="Actions" className="text-forge-xs font-semibold uppercase tracking-wide text-forgeInk-400">
            {actions.map((a) => (
              <Command.Item
                key={a.id}
                value={`${a.label} ${(a.keywords ?? []).join(" ")}`}
                keywords={a.keywords}
                onSelect={() => {
                  a.onSelect();
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-forge-sm px-3 py-2 text-forge-sm text-forgeInk-800 aria-selected:bg-forgeSurface-sunken aria-selected:text-forgeBrand-700"
              >
                {a.icon ? <span className="text-forgeInk-500">{a.icon}</span> : null}
                {a.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="border-t border-forgeInk-100 px-3 py-2 text-forge-xs text-forgeInk-500">
          <kbd className="rounded-forge-sm border border-forgeInk-200 bg-forgeSurface-sunken px-1.5 py-0.5 font-forgeMono">
            Esc
          </kbd>{" "}
          close ·{" "}
          <kbd className="rounded-forge-sm border border-forgeInk-200 bg-forgeSurface-sunken px-1.5 py-0.5 font-forgeMono">
            ⌘K
          </kbd>{" "}
          toggle
        </div>
      </Command>
    </div>
  );
}
