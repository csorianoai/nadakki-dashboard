"use client";

/**
 * Explicit confirmation modal shown before a dealer accepts an offer.
 *
 * Ported (rewritten, not copied) from the retired legacy
 * `components/credit/SelectionConfirmModal.tsx` during the legacy offers-flow
 * consolidation. Uses the canonical `CreditOffer` type (lib/credit-hub/types/offers)
 * — NOT the legacy `Offer` type — and the repo's shared `ui/dialog` primitive.
 *
 * Rationale: accepting an offer is irreversible (sibling offers are auto-marked
 * `not_selected` and the application moves to OFFER_SELECTED), so a confirmation
 * step guards against accidental selection. Owner: Credit Hub Dealer.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";

export interface OfferConfirmModalProps {
  offer: CreditOffer | null;
  /** Human-readable lender label (resolved by the parent). */
  lenderName: string;
  /** Currency prefix from tenant config (e.g. "RD$"). */
  currencyPrefix: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (offerId: string) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function OfferConfirmModal({
  offer,
  lenderName,
  currencyPrefix,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: OfferConfirmModalProps) {
  const handleConfirm = () => {
    if (!offer) return;
    void onConfirm(offer.id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="offer-confirm-modal">
        <DialogHeader>
          <DialogTitle>Confirmar selección de oferta</DialogTitle>
          <DialogDescription>
            Al confirmar, esta oferta quedará seleccionada y las demás se marcarán como
            descartadas. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {offer ? (
          <dl className="grid gap-3 py-2 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: "var(--ch-text-3)" }}>Banco</dt>
              <dd className="font-medium" data-testid="confirm-modal-lender">{lenderName}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--ch-text-3)" }}>Monto aprobado</dt>
              <dd className="font-medium ch-mono" data-testid="confirm-modal-amount">
                {offer.amount_approved != null ? chMoneyExact(offer.amount_approved, currencyPrefix) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--ch-text-3)" }}>Tasa (APR)</dt>
              <dd className="font-medium ch-mono" data-testid="confirm-modal-rate">
                {offer.interest_rate_apr != null ? `${offer.interest_rate_apr}%` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--ch-text-3)" }}>Plazo</dt>
              <dd className="font-medium ch-mono" data-testid="confirm-modal-term">
                {offer.term_months != null ? `${offer.term_months} meses` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--ch-text-3)" }}>Cuota mensual</dt>
              <dd className="font-medium ch-mono" data-testid="confirm-modal-payment">
                {offer.monthly_payment != null ? chMoneyExact(offer.monthly_payment, currencyPrefix) : "—"}
              </dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            className="ch-btn ch-btn-secondary min-h-[44px]"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="confirm-modal-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="ch-btn ch-btn-persona min-h-[44px]"
            onClick={handleConfirm}
            disabled={isSubmitting || !offer}
            data-testid="confirm-modal-accept"
          >
            {isSubmitting ? "Confirmando…" : "Confirmar selección"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
