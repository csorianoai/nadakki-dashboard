"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/forge";
import {
  bankQueueCanGoNext,
  bankQueuePageRangeLabel,
  bankQueueTotalPages,
  type BankQueueListMeta,
  resolveBankQueueTotal,
} from "@/lib/credit-hub/bank/queuePagination";

export type BankQueuePaginationProps = {
  page: number;
  pageSize: number;
  rowCount: number;
  meta?: BankQueueListMeta;
  locale: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function pageWindow(current: number, totalPages: number, maxButtons = 5): number[] {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function BankQueuePagination({
  page,
  pageSize,
  rowCount,
  meta,
  locale,
  onPageChange,
  disabled,
}: BankQueuePaginationProps) {
  const total = resolveBankQueueTotal(meta);
  const totalPages = bankQueueTotalPages(total, pageSize);
  const canPrev = page > 1;
  const canNext = bankQueueCanGoNext({ page, pageSize, rowCount, total });
  const canLast = totalPages != null && page < totalPages;
  const rangeLabel = bankQueuePageRangeLabel({ page, pageSize, rowCount, total, locale });

  const pages = totalPages != null ? pageWindow(page, totalPages) : [page];

  return (
    <nav
      className="flex flex-col gap-3 border-t border-forgeGray-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginación de bandeja"
      data-testid="bank-queue-pagination"
    >
      <p className="text-forge-sm text-forgeGray-600">
        <span className="font-medium tabular-nums text-forgeGray-700">{rangeLabel}</span>
        {totalPages != null ? (
          <span className="text-forgeGray-500">
            {" "}
            · Página {page} de {totalPages}
          </span>
        ) : (
          <span className="text-forgeGray-500"> · Página {page}</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 min-w-[44px] px-2"
          disabled={disabled || !canPrev}
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === page ? "primary" : "secondary"}
            className="min-h-10 min-w-[40px] px-2 tabular-nums"
            disabled={disabled || p === page}
            aria-label={`Página ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        <Button
          type="button"
          variant="secondary"
          className="min-h-10 min-w-[44px] px-2"
          disabled={disabled || !canNext}
          aria-label="Página siguiente"
          onClick={() => onPageChange(page + 1)}
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Siguiente</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>

        {canLast ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-10 px-3"
            disabled={disabled}
            aria-label={`Última página (${totalPages})`}
            onClick={() => onPageChange(totalPages!)}
          >
            Última
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
