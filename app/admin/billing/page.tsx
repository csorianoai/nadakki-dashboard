"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Loader2, Zap } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";

interface Plan {
  id: string;
  name: string;
  price: number;
  executions_limit: number;
  features: string[];
}

export default function AdminBillingPage() {
  const { tenantId } = useTenant();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setPlans([]);
      setCurrentPlan(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let plansLoaded: Plan[] = [];
    let plansFailed = false;

    Promise.all([
      fetch(`${API_URL}/api/v1/billing/plans`)
        .then(async (r) => {
          if (!r.ok) {
            plansFailed = true;
            return;
          }
          const d = await r.json().catch(() => null);
          const list = d?.plans || d?.data?.plans || d;
          if (!Array.isArray(list)) {
            plansFailed = true;
            return;
          }
          plansLoaded = list.map((p: Record<string, unknown>) => ({
            id: String(p.id ?? (p.name as string)?.toLowerCase() ?? ""),
            name: String(p.name ?? p.id ?? ""),
            price: Number(p.price ?? p.price_monthly ?? 0),
            executions_limit: Number(p.executions_limit ?? p.executionsLimit ?? 0),
            features: Array.isArray(p.features) ? (p.features as string[]) : [],
          })).filter((p) => p.id.length > 0);
        })
        .catch(() => {
          plansFailed = true;
        }),
      fetch(`${API_URL}/api/v1/tenants/${tenantId}/billing`)
        .then(async (r) => {
          if (!r.ok) {
            setCurrentPlan(null);
            return;
          }
          const d = await r.json().catch(() => null);
          const plan = d?.plan ?? d?.data?.plan;
          if (plan != null && String(plan).length > 0) {
            setCurrentPlan(String(plan).toLowerCase());
          } else {
            setCurrentPlan(null);
          }
        })
        .catch(() => {
          setCurrentPlan(null);
        }),
    ])
      .then(() => {
        if (plansFailed) {
          setPlans([]);
          setError("No se pudieron cargar los planes. Compruebe la API de billing.");
          return;
        }
        setPlans(plansLoaded);
        if (plansLoaded.length === 0) {
          setError(null);
        }
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  const handleUpgrade = (planId: string) => {
    if (!tenantId) return;
    setActionError(null);
    setUpgrading(planId);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    })
      .then((r) => {
        if (r.ok) {
          setCurrentPlan(planId.toLowerCase());
          return;
        }
        setActionError(`No se pudo actualizar el plan (${r.status}).`);
      })
      .catch(() => {
        setActionError("No se pudo actualizar el plan (error de red).");
      })
      .finally(() => setUpgrading(null));
  };

  if (loading) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 mt-1">Seleccione un tenant para ver planes y facturación.</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin">
          <span className="text-sm text-gray-400">Tenant: {tenantId}</span>
        </NavigationBar>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing</h1>
          <p className="text-red-400 mt-2">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin">
          <span className="text-sm text-gray-400">Tenant: {tenantId}</span>
        </NavigationBar>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 mt-1">No hay planes publicados por la API.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <span className="text-sm text-gray-400">Tenant: {tenantId}</span>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-1">Planes y facturación</p>
      </motion.div>
      {actionError && <p className="text-red-400 mb-4">{actionError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const isActive = currentPlan != null && currentPlan === plan.id;
          const isUpgrading = upgrading === plan.id;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard
                className={`p-6 relative overflow-visible ${isActive ? "ring-2 ring-purple-500 border-purple-500/50" : ""}`}
                hover={!isActive}
              >
                {isActive && (
                  <span className="absolute -top-2 left-4 px-2 py-0.5 rounded bg-purple-500 text-white text-xs font-medium">Activo</span>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${plan.price.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">/mes</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{plan.executions_limit?.toLocaleString() || "—"} ejecuciones/mes</p>
                <ul className="space-y-2 mb-6">
                  {(plan.features || []).map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isActive || isUpgrading}
                  className="w-full py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isActive ? "Plan actual" : "Upgrade"}
                </button>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
