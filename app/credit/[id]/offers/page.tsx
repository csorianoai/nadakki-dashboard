"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { OfferComparisonCards } from "@/components/credit/OfferComparisonCards";
import { SelectionConfirmModal } from "@/components/credit/SelectionConfirmModal";
import { useOffers } from "@/hooks/useOffers";
import { useSelectOffer } from "@/hooks/useSelectOffer";
import { useAuthContext } from "@/hooks/useAuthContext";
import type { Offer } from "@/types/credit-offers";

interface OffersPageProps {
  params: { id: string };
}

export default function OffersPage({ params }: OffersPageProps) {
  const router = useRouter();
  const applicationId = params.id;
  const { tenantId } = useAuthContext();

  const [modalOffer, setModalOffer] = useState<Offer | null>(null);
  const modalOfferRef = useRef<Offer | null>(null);
  modalOfferRef.current = modalOffer;

  const selectOfferRef = useRef<(offerId: string) => Promise<Offer>>(
    async () => {
      throw new Error("selectOffer not initialized");
    },
  );

  const { data, isLoading, isError, error, refetch } = useOffers({
    applicationId,
    tenantId,
    refetchInterval: 5000, // poll every 5s while page open
  });

  const offers = data?.offers ?? [];

  const { selectOffer, isSubmitting } = useSelectOffer({
    applicationId,
    tenantId,
    offers,
    onSuccess: (offer) => {
      toast.success(`Oferta de ${offer.lender_code} seleccionada`, {
        description: "Redirigiendo a funding workflow...",
      });
      setModalOffer(null);
      // Redirect to funding placeholder route — TP-CAP11-funding pending
      setTimeout(() => router.push(`/credit/${applicationId}/funding`), 600);
    },
    onError: (err) => {
      toast.error("Error al seleccionar oferta", {
        description: err.message,
        action: {
          label: "Reintentar",
          onClick: () => {
            const m = modalOfferRef.current;
            if (m) {
              void selectOfferRef.current(m.id).catch(() => {
                /* onError toast from hook */
              });
            }
          },
        },
      });
    },
  });

  selectOfferRef.current = selectOffer;

  const handleOpenModal = useCallback(
    (offerId: string) => {
      const offer = offers.find((o) => o.id === offerId);
      if (offer) setModalOffer(offer);
    },
    [offers],
  );

  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) setModalOffer(null);
  }, [isSubmitting]);

  const handleConfirm = useCallback(
    async (offerId: string) => {
      try {
        await selectOffer(offerId);
      } catch {
        // onError ya muestra toast — no rethrow
      }
    },
    [selectOffer],
  );

  if (isLoading) {
    return (
      <div className="container py-8" data-testid="offers-loading">
        <p className="text-muted-foreground">Cargando ofertas...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-8" data-testid="offers-error">
        <h2 className="text-lg font-semibold">Error al cargar ofertas</h2>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
        <button
          type="button"
          className="mt-4 text-sm underline"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" data-testid="offers-page">
      <header>
        <h1 className="text-2xl font-bold">Ofertas disponibles</h1>
        <p className="text-sm text-muted-foreground">
          Aplicación {applicationId} — {offers.length} oferta
          {offers.length === 1 ? "" : "s"}
        </p>
      </header>

      <OfferComparisonCards offers={offers} onSelectOffer={handleOpenModal} />

      <SelectionConfirmModal
        offer={modalOffer}
        open={modalOffer !== null}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
