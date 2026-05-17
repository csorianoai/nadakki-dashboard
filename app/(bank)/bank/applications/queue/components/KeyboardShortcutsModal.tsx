"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atajos de teclado</DialogTitle>
          <DialogDescription id="bank-queue-shortcuts-desc">
            Disponibles cuando el foco no está en un campo de texto.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-2 space-y-2 text-forge-sm text-forgeGray-800">
          <li>
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">/</kbd> Enfocar búsqueda
          </li>
          <li>
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">?</kbd> Mostrar esta ayuda
          </li>
          <li>
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">j</kbd> /{" "}
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">k</kbd> Mover selección en la tabla
          </li>
          <li>
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">Enter</kbd> Abrir solicitud
            seleccionada
          </li>
          <li>
            <kbd className="rounded border bg-forgeGray-50 px-1 font-forgeMono text-forge-xs">Esc</kbd> Cerrar este diálogo
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
