"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BankDashboardHero } from "@/components/credit-hub/bank/BankDashboardHero";
import { BankExecutiveMetrics } from "@/components/credit-hub/bank/BankExecutiveMetrics";
import { BankQueueList } from "@/components/credit-hub/bank/BankQueueList";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

export default function BankDashboardPage() {
  const queueQuery = useBankQueue();
  const analyticsQuery = useBankAnalytics();
  const applications = (queueQuery.data?.applications ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <BankDashboardHero />
      <BankExecutiveMetrics analytics={analyticsQuery.data} loading={analyticsQuery.isLoading} />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-forge-text">Bandeja priorizada</h2>
          <Link href="/credit-hub/bank/applications">
            <ForgeButton variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>Ver bandeja completa</ForgeButton>
          </Link>
        </div>
        <BankQueueList applications={applications} loading={queueQuery.isLoading} error={queueQuery.error} />
      </section>
    </div>
  );
}
