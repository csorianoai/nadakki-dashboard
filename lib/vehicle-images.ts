/** Vehicle listing image URLs — imagin.studio primary, Unsplash fallback per seed id. */

import type { Vehicle } from "@/lib/vehicles";

/** imagin.studio modelFamily slugs (trim stripped). */
const MODEL_FAMILY: Record<number, string> = {
  1: "corolla",
  2: "cr-v",
  3: "tucson",
  4: "sportage",
  5: "sentra",
  6: "civic",
  7: "rav4",
  8: "elantra",
  9: "glc",
  10: "x3",
};

const MAKE_SLUG: Record<string, string> = {
  Toyota: "toyota",
  Honda: "honda",
  Hyundai: "hyundai",
  Kia: "kia",
  Nissan: "nissan",
  "Mercedes-Benz": "mercedes",
  BMW: "bmw",
};

export const VEHICLE_IMAGE_FALLBACK: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format",
  2: "https://images.unsplash.com/photo-1604070023502-a8e94eb1def0?w=600&auto=format",
  3: "https://images.unsplash.com/photo-1568844293986-8d4b40f43a6f?w=600&auto=format",
  4: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format",
  5: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&auto=format",
  6: "https://images.unsplash.com/photo-1619767886555-eb8a787bf922?w=600&auto=format",
  7: "https://images.unsplash.com/photo-1623869675781-0e3a1d090147?w=600&auto=format",
  8: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format",
  9: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&auto=format",
  10: "https://images.unsplash.com/photo-1555215695-3004980adade?w=600&auto=format",
};

export function getVehicleImaginUrl(vehicle: Vehicle): string {
  const make = MAKE_SLUG[vehicle.make] ?? vehicle.make.toLowerCase().replace(/\s+/g, "-");
  const modelFamily =
    MODEL_FAMILY[vehicle.id] ??
    vehicle.model.toLowerCase().replace(/\s+/g, "-").split("-")[0] ??
    "sedan";

  const params = new URLSearchParams({
    customer: "demo",
    make,
    modelFamily,
    modelYear: String(vehicle.year),
    angle: "25",
    width: "600",
    paintId: "pspc0004",
  });

  return `https://cdn.imagin.studio/getimage?${params.toString()}`;
}

export function getVehicleFallbackUrl(vehicle: Vehicle): string | undefined {
  return VEHICLE_IMAGE_FALLBACK[vehicle.id];
}
