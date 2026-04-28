"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function BankAnalyticsCharts({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const t = useTranslations();
  const statusData = Object.entries(analytics?.applications_by_status ?? {}).map(([name, value]) => ({ name, value }));
  const cohortData = analytics?.cohort_analysis ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ForgeCard>
        <h3 className="mb-4 font-semibold text-forge-text">{t.bank.charts_by_status}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>
                {statusData.map((_, index) => <Cell key={index} fill={["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"][index % 4]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ForgeCard>
      <ForgeCard>
        <h3 className="mb-4 font-semibold text-forge-text">{t.bank.charts_cohorts}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#ff6b35" />
              <Bar dataKey="approved" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ForgeCard>
    </div>
  );
}
