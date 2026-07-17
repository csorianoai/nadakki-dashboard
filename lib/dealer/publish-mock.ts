/** Mock AI-generated listing from photos — Fase 8 demo. */

import { VEHICLES_SEED, type Vehicle } from "@/lib/vehicles";

export type GeneratedListing = {
  listingId: string;
  make: string;
  model: string;
  year: number;
  km: number;
  price: number;
  suggestedPrice: number;
  priceExplanation: string;
  description: string;
  features: string[];
  confidence: number;
  confidenceLabel: string;
  vehicle: Vehicle;
};

const FEATURE_POOL = [
  "Automático",
  "A/C",
  "Bluetooth",
  "Cámara reversa",
  "CarPlay",
  "Cuero",
  "Sunroof",
  "Sensores",
  "Control crucero",
];

export function simulateListingFromPhotos(_photoCount: number): GeneratedListing {
  const base = VEHICLES_SEED[Math.floor(Math.random() * VEHICLES_SEED.length)]!;
  const confidence = 70 + Math.floor(Math.random() * 26);
  const features = FEATURE_POOL.sort(() => Math.random() - 0.5).slice(0, 5);

  return {
    listingId: `draft-${Date.now()}`,
    make: base.make,
    model: base.model,
    year: base.year,
    km: base.km + Math.floor(Math.random() * 5000),
    price: base.price,
    suggestedPrice: Math.round(base.price * (0.97 + Math.random() * 0.06)),
    priceExplanation:
      "Basado en 12 listings similares en RD en los últimos 30 días, ajustado por kilometraje y demanda local.",
    description: `${base.year} ${base.make} ${base.model} en excelente estado. ${features.join(", ")}. Ideal para uso diario en RD. Publicado con Nadakki AI Vision.`,
    features,
    confidence,
    confidenceLabel:
      confidence >= 90 ? "Alta confianza" : confidence >= 75 ? "Buena confianza" : "Media — revisa detalles",
    vehicle: base,
  };
}

export type PublishResult = {
  listingId: string;
  vehicleId: number;
  publishedAt: string;
  elapsedSeconds: number;
};

export function simulatePublish(listingId: string, vehicleId: number): PublishResult {
  return {
    listingId,
    vehicleId,
    publishedAt: new Date().toISOString(),
    elapsedSeconds: 85 + Math.floor(Math.random() * 10),
  };
}
