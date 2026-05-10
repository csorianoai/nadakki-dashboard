"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { DocumentGenerationDialog } from "@/components/legal/cases/DocumentGenerationDialog";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

type Props = {
  tenantId: string;
  caseId: string;
  /** Modo controlado (p. ej. CTA de lista vacía). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DocumentGenerationButton({ tenantId, caseId, open: openProp, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (!controlled) setInternalOpen(next);
  };
  const m = useLegalCasesMessages().generate_document;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="legal-generate-doc-dialog"
        className="inline-flex items-center gap-2 rounded-forge-md bg-forgeBrand-600 px-4 py-2.5 text-sm font-semibold text-forgeGray-50 shadow-forge-sm hover:bg-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        {m.button_cta}
      </button>
      <DocumentGenerationDialog
        tenantId={tenantId}
        caseId={caseId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
