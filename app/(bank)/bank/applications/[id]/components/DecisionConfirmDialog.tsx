"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DecisionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
}

/** Confirm abandon when dismiss from Esc / backdrop (SPEC-003). */
export function DecisionConfirmDialog({ open, onOpenChange, onConfirmLeave }: DecisionConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[120] max-w-md border-forgeGray-200 bg-white"
        aria-describedby={undefined}
        onEscapeKeyDown={(e) => {
          if (open) e.preventDefault();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-forgeGray-900">¿Salir del formulario?</DialogTitle>
        </DialogHeader>
        <p className="text-forge-sm text-forgeGray-600">Los cambios no guardados se descartarán.</p>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            className="rounded-lg border border-forgeGray-300 px-4 py-2 text-forge-sm font-medium text-forgeGray-900 hover:bg-forgeGray-50"
            onClick={() => onOpenChange(false)}
          >
            Continuar editando
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-rose-700"
            onClick={() => {
              onConfirmLeave();
              onOpenChange(false);
            }}
          >
            Salir sin guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
