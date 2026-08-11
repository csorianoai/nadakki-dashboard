"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BankApplicationsTable } from "@/components/credit-hub/bank/BankApplicationsTable";
import { TableSkeleton } from "@/components/credit-hub/primitives";
import { BANK_QUEUE_PAGE_SIZE, resolveBankQueueTotal } from "@/lib/credit-hub/bank/queuePagination";
import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { useAuth } from "@/hooks/useAuth";

function BankApplicationsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { apiTenantId } = useTenant();
  const urlQ = searchParams.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const queueFilters = useMemo(() => (urlQ.trim() ? { q: urlQ.trim() } : undefined), [urlQ]);
  const queueQuery = useBankQueue({ limit: BANK_QUEUE_PAGE_SIZE, offset: (page - 1) * BANK_QUEUE_PAGE_SIZE, filters: queueFilters });
  const bulkMutation = useBulkActions();
  const [search, setSearch] = useState(urlQ);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setSearch(urlQ), [urlQ]);

  const pushParams = useCallback(
    (nextQ: string, nextPage: number) => {
      const p = new URLSearchParams();
      if (nextQ.trim()) p.set("q", nextQ.trim());
      if (nextPage > 1) p.set("page", String(nextPage));
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router]
  );

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    const ids = queueQuery.data?.applications.map((a) => a.application_id) ?? [];
    setSelected((s) => (s.size === ids.length ? new Set() : new Set(ids)));
  };

  return (
    <BankApplicationsTable
      items={queueQuery.data?.applications ?? []}
      total={resolveBankQueueTotal(queueQuery.data) ?? 0}
      page={page}
      pageSize={BANK_QUEUE_PAGE_SIZE}
      search={search}
      isLoading={isChPanelLoading(queueQuery, !!apiTenantId)}
      isError={!!queueQuery.error}
      onSearchChange={(q) => {
        setSearch(q);
        pushParams(q, 1);
      }}
      onPageChange={(p) => pushParams(search, p)}
      onRetry={() => void queueQuery.refetch()}
      selected={selected}
      onToggle={toggle}
      onToggleAll={toggleAll}
      onClearSelection={() => setSelected(new Set())}
      onBulkApply={() => {
        if (selected.size === 0) return;
        void bulkMutation.mutateAsync({
          applicationIds: [...selected],
          rule: "APROBAR_SCORE_GTE_800",
          analystId: user?.id ?? "unknown",
          justification: "Acción masiva desde bandeja",
        });
      }}
    />
  );
}

export default function BankApplicationsQueuePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <BankApplicationsPageInner />
    </Suspense>
  );
}
