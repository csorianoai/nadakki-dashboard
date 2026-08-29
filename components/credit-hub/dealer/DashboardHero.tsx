"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "@/lib/motion-stub";
import { ArrowRight, Plus } from "lucide-react";
import { ForgeButton } from "../primitives/ForgeButton";
import { CountUpNumber } from "./CountUpNumber";

interface DashboardHeroProps {
  pendingCount: number | null;
  userName?: string;
  loading?: boolean;
}

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardHero({ pendingCount, userName, loading }: DashboardHeroProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] via-[#FF8C42] to-[#FFB627]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.2), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(255,182,39,0.3), transparent 50%)",
        }}
      />

      <motion.div
        className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-white/10 blur-xl"
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative px-6 py-10 md:px-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <h1 className="font-display text-3xl font-bold text-white md:text-5xl">
            {greeting}
            {userName ? `, ${userName}` : ""}
          </h1>

          <div className="mt-3 text-lg text-white/90 md:text-xl">
            {loading ? (
              <span className="inline-block h-7 w-48 animate-pulse rounded bg-white/20" />
            ) : pendingCount === null ? (
              <span>Vista general de tu portafolio</span>
            ) : pendingCount === 0 ? (
              <span>No hay solicitudes pendientes hoy.</span>
            ) : (
              <span>
                Tienes <CountUpNumber value={pendingCount} className="font-bold" />{" "}
                {pendingCount === 1 ? "solicitud" : "solicitudes"} pendiente{pendingCount !== 1 ? "s" : ""}.
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/credit-hub/dealer/applications/new?new=1">
              <ForgeButton variant="white" size="lg" leftIcon={<Plus className="h-5 w-5" />}>
                Nueva Solicitud
              </ForgeButton>
            </Link>
            <Link href="/credit-hub/dealer/applications">
              <ForgeButton variant="ghost-white" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Ver Todas
              </ForgeButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
