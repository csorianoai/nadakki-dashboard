"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";

export interface OfferRejectModalProps {
  offer: CreditOffer | null;
  lenderName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (offerId: string) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function OfferRejectModal({
  offer,
  lenderName,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: OfferRejectModalProps) {
  const handleConfirm = () => {
    if (!offer) return;
    void onConfirm(offer.id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="offer-reject-modal">
        <DialogHeader>
          <DialogTitle>Rechazar contrapropuesta</DialogTitle>
          <DialogDescription>
            ¿Rechazar esta contrapropuesta? La solicitud seguirá abierta para otros bancos.
          </DialogDescription>
        </DialogHeader>

        {offer ? (
          <p className="text-sm text-forgeGray-600">
            Banco: <strong>{lenderName}</strong>
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            className="ch-btn ch-btn-secondary min-h-[44px]"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="reject-modal-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="ch-btn ch-btn-secondary min-h-[44px]"
            onClick={handleConfirm}
            disabled={isSubmitting || !offer}
            data-testid="reject-modal-confirm"
          >
            {isSubmitting ? "Rechazando…" : "Confirmar rechazo"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
