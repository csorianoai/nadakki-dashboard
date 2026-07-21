/** Input validation for Autos Portal client surfaces. */

import { z } from "zod";

export const vehicleIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const priceSchema = z.number().finite().min(0).max(100_000_000);

export const downPaymentSchema = z.number().finite().min(0);

export const termMonthsSchema = z.number().int().min(12).max(84);

export const shareTokenSchema = z.string().min(8).max(2000);

export function parseVehicleId(raw: unknown): string {
  return vehicleIdSchema.parse(String(raw ?? ""));
}

export function parseShareToken(raw: unknown): string {
  return shareTokenSchema.parse(String(raw ?? ""));
}

export function safeDownPayment(value: number, vehiclePrice: number): number {
  const dp = downPaymentSchema.parse(value);
  const price = priceSchema.parse(vehiclePrice);
  return Math.min(dp, price);
}
