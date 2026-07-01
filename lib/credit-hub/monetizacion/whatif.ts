/**
 * What-if billing simulator — HANDOFF §4.2 (B3 uses marginal bands).
 */
import type { WhatIfInput, WhatIfResult } from "./types";

export const PERIOD_PRINCIPAL = 78_500_000;
export const ITBIS_RATE = 0.18;
export const ANCHOR_INVOICE_TOTAL = 462_442;
export const ADD_AI_AMOUNT = 59_400;
export const ADD_SEATS_AMOUNT = 12_000;
export const ADD_SETUP_AMOUNT = 25_000;

export function itbis(subtotal: number): number {
  return Math.round(subtotal * ITBIS_RATE * 100) / 100;
}

/** Marginal volume bands: ≤25M @40bps · 25–75M @28bps · >75M @18bps. */
export function volumeBand(principal: number): number {
  const tier1 = Math.min(principal, 25_000_000);
  const tier2 = Math.min(Math.max(principal - 25_000_000, 0), 50_000_000);
  const tier3 = Math.max(principal - 75_000_000, 0);
  return Math.round(tier1 * 0.004 + tier2 * 0.0028 + tier3 * 0.0018);
}

export function whatif(input: WhatIfInput): WhatIfResult {
  const P = input.principal ?? PERIOD_PRINCIPAL;
  const com = Math.round((input.bps / 10_000) * P);
  const lines: { label: string; amount: number }[] = [];
  let subtotal = 0;

  switch (input.base) {
    case "B1": {
      const commission = Math.max(com, 150_000);
      lines.push({ label: `Comisión pura · ${input.bps} bps`, amount: com });
      if (commission > com) {
        lines.push({ label: "Ajuste a mínimo garantizado", amount: commission - com });
      }
      subtotal = commission;
      break;
    }
    case "B2": {
      subtotal = 85_000 + com;
      lines.push({ label: "Base mensual (suscripción)", amount: 85_000 });
      lines.push({ label: `Comisión reducida · ${input.bps} bps`, amount: com });
      break;
    }
    case "B3": {
      const band = volumeBand(P);
      subtotal = band;
      lines.push({ label: "Por volumen aprobado (bandas)", amount: band });
      break;
    }
    case "B4": {
      subtotal = 380_000;
      lines.push({ label: "Ilimitado · flat mensual", amount: 380_000 });
      break;
    }
  }

  if (input.addSetup) {
    subtotal += ADD_SETUP_AMOUNT;
    lines.push({ label: "Setup inicial (one-time)", amount: ADD_SETUP_AMOUNT });
  }
  if (input.addAI) {
    subtotal += ADD_AI_AMOUNT;
    lines.push({ label: "AI metered (add-on)", amount: ADD_AI_AMOUNT });
  }
  if (input.addSeats) {
    subtotal += ADD_SEATS_AMOUNT;
    lines.push({ label: "Seats · 8 analistas", amount: ADD_SEATS_AMOUNT });
  }

  const itbisAmount = itbis(subtotal);
  const total = Math.round((subtotal + itbisAmount) * 100) / 100;

  return {
    subtotal,
    itbis: itbisAmount,
    total,
    delta: Math.round((total - ANCHOR_INVOICE_TOTAL) * 100) / 100,
    lines,
  };
}

export function sumEvents(events: { amount: number }[]): number {
  return events.reduce((acc, e) => acc + e.amount, 0);
}

export function reconcile(invoice: { lines: { amount: number }[]; subtotal: number }) {
  const reconciledSum = invoice.lines.reduce((acc, line) => acc + line.amount, 0);
  const discrepancy = Math.round((invoice.subtotal - reconciledSum) * 100) / 100;
  return { reconciledSum, discrepancy };
}
