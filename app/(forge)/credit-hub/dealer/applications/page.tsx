"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { ApplicationCard } from "@/components/credit-hub/dealer/ApplicationCard";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import { CHEmptyState } from "@/components/credit-hub/system/CHEmptyState";
import { PullToRefresh } from "@/components/credit-hub/system/PullToRefresh";
import { useApplications } from "@/lib/credit-hub/hooks/useApplications";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "Todas" },
  { id: "draft", label: "Borrador" },
  { id: "submitted", label: "Enviadas" },
];

export default function DealerApplicationsPage() {
  const { data: applications = [], isLoading, error, refetch } = useApplications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = applications;

    if (activeFilter !== "all") {
      result = result.filter((application) => application.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (application) =>
          application.applicant_name.toLowerCase().includes(query) ||
          application.vehicle_make?.toLowerCase().includes(query) ||
          application.vehicle_model?.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeFilter, applications, searchQuery]);

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-forge-text">Solicitudes</h1>
        <Link href="/credit-hub/dealer/applications/new" className="hidden md:block">
          <ForgeButton variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Nueva Solicitud
          </ForgeButton>
        </Link>
      </div>

      <ForgeInput
        placeholder="Buscar por nombre, marca, modelo..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const count = filter.id === "all" ? applications.length : applications.filter((application) => application.status === filter.id).length;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={activeFilter === filter.id}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                activeFilter === filter.id
                  ? "bg-forge-primary text-white shadow-md shadow-forge-primary/25"
                  : "bg-forge-surface-elevated text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
              )}
            >
              {filter.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-forge-surface" />
          ))}
        </div>
      ) : error ? (
        <ForgeCard className="py-12 text-center">
          <p className="text-forge-danger">Error al cargar solicitudes</p>
          <p className="mt-1 text-sm text-forge-text-muted">Inténtalo de nuevo en un momento</p>
        </ForgeCard>
      ) : filtered.length === 0 ? (
        <ForgeCard className="py-8">
          <CHEmptyState
            title={searchQuery || activeFilter !== "all" ? "No encontramos coincidencias" : "Tu pipeline está esperando"}
            description={
              searchQuery || activeFilter !== "all"
                ? "Ajusta la búsqueda o cambia el filtro para ver más solicitudes."
                : "Cada solicitud es un cliente más cerca de su nuevo carro. Empieza ahora."
            }
            primaryAction={{
              label: "Crear Primera Solicitud",
              href: "/credit-hub/dealer/applications/new",
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </ForgeCard>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 md:hidden">
            {filtered.map((application) => (
              <ApplicationCard key={application.application_id} application={application} variant="card" />
            ))}
          </div>

          <div className="hidden space-y-2 md:block">
            {filtered.map((application) => (
              <ApplicationCard key={application.application_id} application={application} variant="compact" />
            ))}
          </div>
        </div>
      )}

      <motion.div className="fixed bottom-24 right-6 z-30 md:hidden" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 300 }}>
        <motion.div
          animate={{
            boxShadow: [
              "0 10px 25px rgba(255,107,53,0.3)",
              "0 10px 35px rgba(255,107,53,0.5)",
              "0 10px 25px rgba(255,107,53,0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Link
            href="/credit-hub/dealer/applications/new"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-forge-primary to-forge-primary-hover transition-transform hover:scale-105 active:scale-95"
            aria-label="Nueva solicitud"
          >
            <Plus className="h-6 w-6 text-white" />
          </Link>
        </motion.div>
      </motion.div>
      </div>
    </PullToRefresh>
  );
}
