"use client";

import Link from "next/link";
import { Car, Search, Users, Calculator, Package } from "lucide-react";
import { motion } from "@/lib/motion-stub";

const NAV_CARDS = [
  {
    title: "Marketplace",
    description: "Buscar y explorar vehículos disponibles",
    href: "/autos/vehiculos",
    icon: Search,
    color: "#3b82f6",
  },
  {
    title: "Inventario",
    description: "Gestionar listados de vehículos",
    href: "/autos/inventory",
    icon: Package,
    color: "#10b981",
  },
  {
    title: "Leads",
    description: "Pipeline de prospectos y CRM",
    href: "/autos/leads",
    icon: Users,
    color: "#f59e0b",
  },
  {
    title: "Calculadora",
    description: "Financiamiento y amortización",
    href: "/autos/finance",
    icon: Calculator,
    color: "#8b5cf6",
  },
] as const;

/** Forge dealer hub — moved from /autos to avoid consumer landing conflict. */
export default function AutosDashboardPage() {
  return (
    <div className="ndk-page ndk-fade-in p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/20 p-3">
            <Car className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Autos Portal</h1>
            <p className="text-gray-400">Marketplace automotriz y gestión de inventario</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {NAV_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={card.href}>
                <div className="group cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-lg">
                  <div
                    className="mb-4 w-fit rounded-xl p-3"
                    style={{
                      backgroundColor: `${card.color}20`,
                      borderColor: `${card.color}30`,
                      borderWidth: 1,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="text-sm text-gray-400">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
