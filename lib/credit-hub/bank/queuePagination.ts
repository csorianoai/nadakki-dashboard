/** Default page size for bank application queue (R-007 / backend PR #307). */
export const BANK_QUEUE_PAGE_SIZE = 20;

export type BankQueueListMeta = {
  total_count?: number;
  total?: number;
};

/** Resolved total when API sends `total_count` or legacy `total`. */
export function resolveBankQueueTotal(meta: BankQueueListMeta | undefined): number | null {
  if (meta == null) return null;
  if (typeof meta.total_count === "number" && !Number.isNaN(meta.total_count)) {
    return meta.total_count;
  }
  if (typeof meta.total === "number" && !Number.isNaN(meta.total)) {
    return meta.total;
  }
  return null;
}

export function bankQueueTotalPages(total: number | null, pageSize: number): number | null {
  if (total == null || total < 0 || pageSize <= 0) return null;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function bankQueueCanGoNext(params: {
  page: number;
  pageSize: number;
  rowCount: number;
  total: number | null;
}): boolean {
  const { page, pageSize, rowCount, total } = params;
  if (total != null) {
    return page * pageSize < total;
  }
  return rowCount >= pageSize;
}

export function bankQueuePageRangeLabel(params: {
  page: number;
  pageSize: number;
  rowCount: number;
  total: number | null;
  locale: string;
}): string {
  const { page, pageSize, rowCount, total, locale } = params;
  if (rowCount === 0) {
    return total != null && total > 0 ? "0 resultados en esta página" : "Sin resultados";
  }
  const start = (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + rowCount;
  const loc = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
  const nf = new Intl.NumberFormat(loc);
  if (total != null) {
    return `${nf.format(start)}–${nf.format(end)} de ${nf.format(total)}`;
  }
  return `${nf.format(start)}–${nf.format(end)}`;
}
