"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Offer } from "@/types/credit-offers";

export interface SelectionConfirmModalProps {
  /** Offer to confirm selection of, or null when modal closed. */
  offer: Offer | null;
  /** Modal open state, derived from `offer !== null` if uncontrolled. */
  open: boolean;
  /** Close handler — should set offer=null in parent. */
  onClose: () => void;
  /** Confirm handler — receives the offer ID. */
  onConfirm: (offerId: string) => Promise<void> | void;
  /** Disable confirm button (e.g., during mutation in-flight). */
  isSubmitting?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  approved: "Aprobada",
  counter_offer: "Contraoferta",
  declined: "Rechazada",
  pending: "Pendiente",
};

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatRate(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(2)}%`;
}

export function SelectionConfirmModal({
  offer,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: SelectionConfirmModalProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!offer) return;
    setInternalSubmitting(true);
    try {
      await onConfirm(offer.id);
    } finally {
      setInternalSubmitting(false);
    }
  };

  const submitting = isSubmitting || internalSubmitting;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="selection-confirm-modal"
      >
        <DialogHeader>
          <DialogTitle>Confirmar selección de oferta</DialogTitle>
          <DialogDescription>
            Al confirmar, esta oferta quedará seleccionada y las otras se marcarán
            como retiradas.
          </DialogDescription>
        </DialogHeader>

        {offer ? (
          <div className="grid gap-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lender</span>
              <span className="font-medium" data-testid="modal-lender-code">
                {offer.lender_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium" data-testid="modal-status">
                {STATUS_LABEL[offer.status] ?? offer.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto aprobado</span>
              <span className="font-medium" data-testid="modal-amount">
                {formatCurrency(offer.amount_approved)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa anual (APR)</span>
              <span className="font-medium" data-testid="modal-rate">
                {formatRate(offer.interest_rate_apr)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plazo</span>
              <span className="font-medium" data-testid="modal-term">
                {offer.term_months ? `${offer.term_months} meses` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuota mensual</span>
              <span className="font-medium" data-testid="modal-payment">
                {formatCurrency(offer.monthly_payment)}
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-testid="modal-cancel-btn"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !offer}
            data-testid="modal-confirm-btn"
          >
            {submitting ? "Confirmando..." : "Confirmar selección"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
