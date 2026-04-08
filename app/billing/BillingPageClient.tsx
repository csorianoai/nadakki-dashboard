"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import BillingDashboard from "@/components/billing/BillingDashboard";
import PricingTable from "@/components/billing/PricingTable";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { useTenant } from "@/contexts/TenantContext";

export default function BillingPageClient() {
  const { tenantId } = useTenant();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const pricingRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const scrollToPricing = useCallback(() => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        {tenantId ? (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">
            {tenantId}
          </span>
        ) : null}
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <CreditCard className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Facturación</h1>
            <p className="text-gray-400 text-sm mt-1 mb-0">
              Plan, Stripe Checkout e historial de facturas
            </p>
          </div>
        </div>
      </motion.div>

      {checkout === "success" ? (
        <GlassCard className="p-4 mb-6 border-emerald-500/30 bg-emerald-500/10">
          <p className="text-emerald-100 text-sm m-0 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Pago iniciado o completado. El webhook de Stripe actualizará el plan
            del tenant en breve. Actualizamos el panel al volver de Checkout.
          </p>
          <button
            type="button"
            onClick={() => bumpRefresh()}
            className="mt-3 text-xs text-emerald-200 underline"
          >
            Refrescar estado ahora
          </button>
        </GlassCard>
      ) : null}

      {checkout === "cancel" ? (
        <GlassCard className="p-4 mb-6 border-white/10 bg-white/5">
          <p className="text-gray-300 text-sm m-0 flex items-start gap-2">
            <XCircle className="w-5 h-5 shrink-0 text-gray-400" />
            Checkout cancelado. Puedes elegir un plan de nuevo cuando quieras.
          </p>
        </GlassCard>
      ) : null}

      <div className="space-y-10">
        <BillingDashboard
          tenantId={tenantId}
          refreshKey={refreshKey}
          onUpgradeClick={scrollToPricing}
        />

        <div ref={pricingRef} id="pricing">
          <PricingTable tenantId={tenantId} />
        </div>

        <InvoiceTable tenantId={tenantId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
