"use client";

import Link from "next/link";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";
import { SLA_RED_HOURS } from "@/lib/bank-application-detail/constants";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency === "DOP" ? "DOP" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

export interface ApplicationHeaderProps {
  detail: BankApplicationDetailResponse;
}

export function ApplicationHeader({ detail }: ApplicationHeaderProps) {
  const hours = detail.hours_until_sla;
  const slaCritical = typeof hours === "number" && hours >= 0 && hours <= SLA_RED_HOURS;
  const slaOverdue = typeof hours === "number" && hours < 0;

  return (
    <header className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Solicitud</p>
          <h1 className="truncate font-display text-2xl font-normal text-forgeGray-900 md:text-3xl">
            {detail.borrower_name_masked}
          </h1>
          <p className="font-forgeMono text-forge-sm text-forgeGray-600">
            ID: <span className="select-all">{detail.application_id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-forgeGray-100 px-3 py-1 text-forge-xs font-medium uppercase text-forgeGray-700">
            {detail.queue_status}
          </span>
          {typeof hours === "number" ? (
            <span
              role="status"
              className={`inline-flex rounded-lg px-3 py-1.5 font-forgeMono text-forge-xs tabular-nums ring-1 ring-inset ${
                slaOverdue
                  ? "bg-rose-50 text-rose-950 ring-rose-300"
                  : slaCritical
                    ? "bg-amber-50 text-amber-950 ring-amber-300"
                    : "bg-forgeGray-50 text-forgeGray-800 ring-forgeGray-200"
              }`}
            >
              SLA:{" "}
              {slaOverdue ? "Vencido" : `${hours.toFixed(1)} h`}
            </span>
          ) : null}
          <span className="text-lg font-semibold tabular-nums text-forgeGray-900 md:text-xl">
            {formatMoney(detail.amount, detail.currency)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 border-t border-forgeGray-100 pt-4 text-forge-sm">
        <p>
          <span className="text-forgeGray-500">Dealer:</span>{" "}
          <span className="font-medium text-forgeGray-900">{detail.dealer?.name ?? "—"}</span>
        </p>
        {detail.dealer?.location ? (
          <p>
            <span className="text-forgeGray-500">Ubicación:</span>{" "}
            <span className="text-forgeGray-800">{detail.dealer.location}</span>
          </p>
        ) : null}
        <Link
          href="/credit-hub/bank/audit"
          className="ml-auto text-forge-sm font-medium text-forgeBrand-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          Ver auditoría del banco
        </Link>
      </div>
    </header>
  );
}
