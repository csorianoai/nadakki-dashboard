"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { FixedModal } from "@/components/system/ModalRoot";
import { Button } from "@/components/ui/button";

const LOCALE = "en-US";

export function formatResultCount(count: number): string {
  return count.toLocaleString(LOCALE);
}

export function formatFacetCount(count: number | null | undefined): string {
  if (count == null) return "—";
  return formatResultCount(count);
}

export function FilterModal({
  title,
  icon: Icon,
  isOpen,
  onClose,
  onClear,
  onApply,
  resultCount,
  backendAvailable = true,
  children,
}: {
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  resultCount: number;
  backendAvailable?: boolean;
  children: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const applyLabel =
    backendAvailable && resultCount > 0
      ? `Ver ${formatResultCount(resultCount)} resultados`
      : "Ver todos";

  return (
    <FixedModal
      open={isOpen}
      onClose={onClose}
      title={title}
      titleId="filter-modal-title"
      icon={<Icon className="h-5 w-5 text-brand" aria-hidden />}
      footer={
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Limpiar
          </button>
          <Button variant="brand" className="font-manrope text-base font-semibold" onClick={onApply}>
            {applyLabel}
          </Button>
        </div>
      }
    >
      <div ref={bodyRef} data-filter-modal-body className="px-5 py-4">
        {children}
      </div>
    </FixedModal>
  );
}
