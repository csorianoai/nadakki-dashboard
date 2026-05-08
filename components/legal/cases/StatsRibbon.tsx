"use client";

import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { LegalCaseWorkbenchStats } from "@/hooks/legal/useCaseStats";
import type { LegalCasesMessages } from "@/hooks/useLegalCasesMessages";

type Props = {
  stats: LegalCaseWorkbenchStats;
  labels: LegalCasesMessages["list"]["revolution"]["stats"];
};

function TrendDial({ ratio }: { ratio: number }) {
  if (ratio >= 0.84) return <TrendingUp className="h-6 w-6 text-emerald-400/90" aria-hidden />;
  if (ratio <= 0.45) return <TrendingDown className="h-6 w-6 text-orange-400/90" aria-hidden />;
  return <Minus className="h-6 w-6 text-zinc-600" aria-hidden />;
}

export function StatsRibbon({ stats, labels }: Props) {
  const healthRatio = stats.healthIndexPercent / 100;

  const cards = [
    {
      key: "total",
      value: stats.total,
      subtitle: labels.sub_total,
      gradient: "from-zinc-900 via-zinc-900/95 to-transparent",
      adornment: null as ReactNode,
    },
    {
      key: "flow",
      value: stats.activeFlow,
      subtitle: labels.sub_active,
      gradient: "from-indigo-700/35 via-transparent to-transparent",
      adornment: null,
    },
    {
      key: "deadlines",
      value: stats.deadlinesDueThisWeek,
      subtitle: labels.sub_deadlines,
      gradient: "from-amber-500/35 via-transparent to-transparent",
      adornment: null,
    },
    {
      key: "health",
      value: `${stats.healthIndexPercent}%`,
      subtitle: labels.sub_health,
      gradient: "from-emerald-500/35 via-transparent to-transparent",
      adornment: <TrendDial ratio={healthRatio} />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label={labels.region_label}>
      {cards.map((item, index) => (
        <motion.div
          key={item.key}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.35), ease: [0.33, 1, 0.68, 1] }}
          className={`relative overflow-hidden rounded-2xl border border-zinc-800/95 bg-gradient-to-br ${item.gradient} p-4 backdrop-blur-md`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.subtitle}</p>
            {item.adornment}
          </div>
          <motion.p
            key={`${item.key}-${item.value}`}
            layout
            className="mt-3 font-medium tabular-nums text-[2.175rem] leading-none tracking-tighter text-white"
          >
            {item.value}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
}
