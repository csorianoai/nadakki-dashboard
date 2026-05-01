"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Car, Plus, Sparkles } from "lucide-react";

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DealerCommandHero({
  totalApplications,
  activePipelineCount,
  newHref,
  listHref,
}: {
  totalApplications: number | null;
  activePipelineCount: number | null;
  newHref: string;
  listHref: string;
}) {
  const greeting = getTimeGreeting();

  return (
    <div className="relative px-6 py-10 md:px-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="max-w-2xl space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/90 ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Dealer Credit Command Center
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            {greeting}
          </h1>
          <p className="text-lg text-white/90 md:text-xl">
            {totalApplications === null ? (
              <span className="inline-block h-7 w-56 animate-pulse rounded bg-white/20" />
            ) : totalApplications === 0 ? (
              <>Sin expedientes aún. Cree el primero y active el motor de evaluación con IA.</>
            ) : (
              <>
                <span className="font-semibold text-white">{totalApplications}</span>{" "}
                {totalApplications === 1 ? "expediente" : "expedientes"} en su tenant
                {activePipelineCount != null && activePipelineCount > 0 ? (
                  <>
                    {" "}
                    · <span className="font-semibold">{activePipelineCount}</span> en flujo activo
                  </>
                ) : null}
                .
              </>
            )}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={newHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-950 shadow-lg transition hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Plus className="h-5 w-5 shrink-0" aria-hidden />
              Nueva solicitud
            </Link>
            <Link
              href={listHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Ver listado completo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="relative flex shrink-0 items-center justify-center lg:w-[280px]">
          <div className="relative flex h-44 w-full max-w-[280px] items-center justify-center rounded-2xl border border-white/25 bg-black/20 p-6 shadow-inner backdrop-blur-md md:h-52">
            <Car className="h-24 w-24 text-white/40 md:h-28 md:w-28" strokeWidth={1} aria-hidden />
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/30 px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/80 ring-1 ring-white/10">
              Showroom digital · AI financing
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
