"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import type { MarketingCampaign } from "@/lib/marketing-api";
import { campaignDisplayName, campaignRowId } from "@/lib/marketing-api";

type ScheduleCalendarProps = {
  campaigns: MarketingCampaign[];
  loading?: boolean;
};

function parseScheduleDate(row: MarketingCampaign): Date | null {
  const sched = row.schedule;
  if (sched && typeof sched === "object") {
    const s = sched as Record<string, unknown>;
    const start = s.start_at ?? s.start_date ?? s.scheduled_at;
    if (typeof start === "string" || typeof start === "number") {
      const d = new Date(start);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  const direct = row.scheduled_at ?? row.start_date ?? row.publish_at;
  if (typeof direct === "string" || typeof direct === "number") {
    const d = new Date(direct);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function ScheduleCalendar({ campaigns, loading = false }: ScheduleCalendarProps) {
  const { upcoming, thisWeek } = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const withDates = campaigns
      .map((c) => ({ campaign: c, date: parseScheduleDate(c) }))
      .filter((x) => x.date !== null) as Array<{ campaign: MarketingCampaign; date: Date }>;

    withDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    const upcoming = withDates.filter((x) => x.date >= now).slice(0, 6);
    const thisWeek = withDates.filter((x) => x.date >= now && x.date <= weekEnd);

    return { upcoming, thisWeek };
  }, [campaigns]);

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">Cargando calendario…</div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold text-white m-0">Calendario de campañas</h3>
        <span className="ml-auto text-xs text-gray-500">{thisWeek.length} esta semana</span>
      </div>
      {upcoming.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500 m-0">Sin fechas programadas en campañas activas.</p>
          <Link
            href="/marketing/calendar"
            className="inline-block mt-3 text-xs text-violet-400 hover:underline"
          >
            Abrir calendario completo
          </Link>
        </div>
      ) : (
        <ul className="space-y-2 m-0 p-0 list-none">
          {upcoming.map(({ campaign, date }) => {
            const id = campaignRowId(campaign);
            return (
              <li key={id}>
                <Link
                  href={`/marketing/campaigns/${encodeURIComponent(id)}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/5 text-sm"
                >
                  <span className="text-white truncate">{campaignDisplayName(campaign)}</span>
                  <time className="text-xs text-gray-500 shrink-0" dateTime={date.toISOString()}>
                    {date.toLocaleDateString("es-DO", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
