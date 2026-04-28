"use client";

import { Search } from "lucide-react";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function BankQueueFilters({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  const t = useTranslations();
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <ForgeInput
        placeholder={t.bank.queue_search_placeholder}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />
      <div className="rounded-xl bg-forge-surface-elevated px-4 py-3 text-sm text-forge-text-muted">{t.bank.queue_order_caption}</div>
    </div>
  );
}
