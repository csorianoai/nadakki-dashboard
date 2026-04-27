"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Clock, DollarSign, Mail, Phone, User } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { useApplication } from "@/lib/credit-hub/hooks/useApplication";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "summary", label: "Resumen", icon: User },
  { id: "vehicle", label: "Vehículo", icon: Car },
  { id: "timeline", label: "Timeline", icon: Clock },
];

export default function DealerApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useApplication(applicationId);
  const [activeTab, setActiveTab] = useState("summary");

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-forge-surface-elevated" />
          <div className="h-64 rounded-2xl bg-forge-surface" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8">
        <ForgeCard className="py-12 text-center">
          <p className="mb-4 text-forge-danger">Error al cargar solicitud</p>
          <ForgeButton variant="secondary" onClick={() => router.back()}>
            Volver
          </ForgeButton>
        </ForgeCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <ForgeButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.back()} className="-ml-3 mb-2">
            Volver
          </ForgeButton>
          <h1 className="font-display text-3xl font-bold text-forge-text">{data.applicant_name}</h1>
          <div className="mt-2">
            <ApplicationStatusBadge status={data.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-forge-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={isActive}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "border-forge-primary text-forge-primary" : "border-transparent text-forge-text-muted hover:text-forge-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {activeTab === "summary" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">Información del Cliente</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-4 w-4 text-forge-text-muted" />
                <div>
                  <dt className="text-xs text-forge-text-muted">Nombre</dt>
                  <dd className="text-forge-text">{data.applicant_name}</dd>
                </div>
              </div>
              {data.applicant_email && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-4 w-4 text-forge-text-muted" />
                  <div>
                    <dt className="text-xs text-forge-text-muted">Email</dt>
                    <dd className="text-forge-text">{data.applicant_email}</dd>
                  </div>
                </div>
              )}
              {data.applicant_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-4 w-4 text-forge-text-muted" />
                  <div>
                    <dt className="text-xs text-forge-text-muted">Teléfono</dt>
                    <dd className="text-forge-text">{data.applicant_phone}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 border-t border-forge-border pt-3">
                <DollarSign className="mt-1 h-4 w-4 text-forge-text-muted" />
                <div>
                  <dt className="text-xs text-forge-text-muted">Monto solicitado</dt>
                  <dd className="font-mono font-semibold text-forge-text">RD$ {Number(data.requested_amount || 0).toLocaleString("es-DO")}</dd>
                </div>
              </div>
            </dl>
          </ForgeCard>
        )}

        {activeTab === "vehicle" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">Información del Vehículo</h2>
            {!data.vehicle_year && !data.vehicle_make && !data.vehicle_model && !data.vehicle_vin ? (
              <p className="py-4 text-center text-forge-text-muted">Sin información de vehículo</p>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                {data.vehicle_year && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Año</dt>
                    <dd className="text-forge-text">{data.vehicle_year}</dd>
                  </div>
                )}
                {data.vehicle_make && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Marca</dt>
                    <dd className="text-forge-text">{data.vehicle_make}</dd>
                  </div>
                )}
                {data.vehicle_model && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Modelo</dt>
                    <dd className="text-forge-text">{data.vehicle_model}</dd>
                  </div>
                )}
                {data.vehicle_vin && (
                  <div className="col-span-2">
                    <dt className="text-xs text-forge-text-muted">VIN</dt>
                    <dd className="font-mono text-sm text-forge-text">{data.vehicle_vin}</dd>
                  </div>
                )}
              </dl>
            )}
          </ForgeCard>
        )}

        {activeTab === "timeline" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">Línea de Tiempo</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-success" />
                <div>
                  <p className="font-medium text-forge-text">Solicitud creada</p>
                  <p className="text-sm text-forge-text-muted">{new Date(data.created_at).toLocaleString("es-DO")}</p>
                </div>
              </div>
              {data.updated_at !== data.created_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-info" />
                  <div>
                    <p className="font-medium text-forge-text">Última actualización</p>
                    <p className="text-sm text-forge-text-muted">{new Date(data.updated_at).toLocaleString("es-DO")}</p>
                  </div>
                </div>
              )}
            </div>
          </ForgeCard>
        )}
      </div>
    </div>
  );
}
