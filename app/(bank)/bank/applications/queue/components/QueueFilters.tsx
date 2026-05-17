"use client";

import type { RefObject } from "react";
import type { BankQueueSortKey, BankQueueStatusFilter } from "@/lib/bank-queue/types";
import { BANK_QUEUE_DEFAULT_LIMIT } from "@/lib/bank-queue/constants";

export interface QueueFiltersState {
  status: BankQueueStatusFilter | "";
  sortBy: BankQueueSortKey;
  limit: number;
}

export interface QueueFiltersProps {
  searchRef: RefObject<HTMLInputElement | null>;
  search: string;
  filters: QueueFiltersState;
  onSearchChange: (value: string) => void;
  onFiltersChange: (patch: Partial<QueueFiltersState>) => void;
}

const SORT_OPTIONS: { value: BankQueueSortKey; label: string }[] = [
  { value: "sla_priority", label: "Prioridad SLA" },
  { value: "hours_until_sla", label: "Horas hasta SLA" },
  { value: "created_at", label: "Fecha creación" },
];

export function QueueFilters({
  searchRef,
  search,
  filters,
  onSearchChange,
  onFiltersChange,
}: QueueFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-forgeGray-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
      <div className="min-w-[220px] flex-1">
        <label htmlFor="bank-queue-search" className="block text-forge-xs font-medium text-forgeGray-700">
          Buscar
        </label>
        <input
          ref={searchRef}
          id="bank-queue-search"
          type="search"
          autoComplete="off"
          placeholder="Nombre, dealer o ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm text-forgeGray-900 shadow-sm focus:border-forgeBrand-500 focus:outline-none focus:ring-2 focus:ring-forgeBrand-400"
        />
        <p className="sr-only" id="bank-queue-search-hint">
          Atajo teclado barra diagonal enfoca este campo.
        </p>
      </div>

      <div className="w-full min-w-[140px] md:w-44">
        <label htmlFor="bank-queue-status" className="block text-forge-xs font-medium text-forgeGray-700">
          Estado
        </label>
        <select
          id="bank-queue-status"
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({
              status: e.target.value as BankQueueStatusFilter | "",
            })
          }
          className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm shadow-sm focus:border-forgeBrand-500 focus:outline-none focus:ring-2 focus:ring-forgeBrand-400"
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="reviewing">En revisión</option>
          <option value="decided">Decidido</option>
        </select>
      </div>

      <div className="w-full min-w-[160px] md:w-52">
        <label htmlFor="bank-queue-sort" className="block text-forge-xs font-medium text-forgeGray-700">
          Ordenar por
        </label>
        <select
          id="bank-queue-sort"
          value={filters.sortBy}
          onChange={(e) =>
            onFiltersChange({
              sortBy: e.target.value as BankQueueSortKey,
            })
          }
          className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm shadow-sm focus:border-forgeBrand-500 focus:outline-none focus:ring-2 focus:ring-forgeBrand-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full min-w-[120px] md:w-36">
        <label htmlFor="bank-queue-limit" className="block text-forge-xs font-medium text-forgeGray-700">
          Por página
        </label>
        <select
          id="bank-queue-limit"
          value={filters.limit}
          onChange={(e) =>
            onFiltersChange({
              limit: Number(e.target.value) || BANK_QUEUE_DEFAULT_LIMIT,
            })
          }
          className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm shadow-sm focus:border-forgeBrand-500 focus:outline-none focus:ring-2 focus:ring-forgeBrand-400"
        >
          {[25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
