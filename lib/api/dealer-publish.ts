/** Dealer AI publish API — Fase 8 with mock fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { demoDelay } from "@/lib/autos-agent/demo-delay";
import { FEATURE_PUBLISH_1CLICK_BACKEND } from "@/lib/autos-agent/feature-flags";
import {
  simulateListingFromPhotos,
  simulatePublish,
  type GeneratedListing,
  type PublishResult,
} from "@/lib/dealer/publish-mock";

export type PublishApiResult<T> = { data: T; fromBackend: boolean };

export async function publishFromPhotos(
  photos: File[],
): Promise<PublishApiResult<GeneratedListing>> {
  if (FEATURE_PUBLISH_1CLICK_BACKEND) {
    try {
      const form = new FormData();
      photos.forEach((f, i) => form.append("photos", f, f.name || `photo-${i}.jpg`));
      const res = await autosFetch<GeneratedListing>(
        "/api/v1/autos_ai/dealer_ai/publish_from_photos",
        { method: "POST", body: form, headers: {} },
      );
      if (res) return { data: res, fromBackend: true };
    } catch (error) {
      console.warn("publishFromPhotos failed, using mock", error);
    }
  }

  await demoDelay(800, 1500);
  return { data: simulateListingFromPhotos(photos.length), fromBackend: false };
}

export async function confirmPublish(
  listingId: string,
  modifications: Partial<GeneratedListing>,
): Promise<PublishApiResult<PublishResult>> {
  if (FEATURE_PUBLISH_1CLICK_BACKEND) {
    try {
      const res = await autosFetch<PublishResult>(
        `/api/v1/autos_ai/dealer_ai/publish/${encodeURIComponent(listingId)}`,
        { method: "POST", body: JSON.stringify(modifications) },
      );
      if (res) return { data: res, fromBackend: true };
    } catch (error) {
      console.warn("confirmPublish failed, using mock", error);
    }
  }

  await demoDelay();
  return {
    data: simulatePublish(listingId, modifications.vehicle?.id ?? 1),
    fromBackend: false,
  };
}
