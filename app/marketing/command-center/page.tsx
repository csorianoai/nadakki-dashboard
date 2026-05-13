"use client";
import { useState, useEffect } from "react";
import { Loader2, BarChart3, TrendingUp, DollarSign, Users, Target, Percent } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import { useTenant } from "@/contexts/TenantContext";
import { tokenStorage } from "@/lib/auth/token-storage";

interface KPI {
  label: string;
  value: string;
  change: string | null;
  color: string;
}

interface Channel {
  name: string;
  revenue: string;
  leads: number;
  conversion: string;
  color: string;
}

export default function CommandCenterPage() {
  const { tenantId } = useTenant();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId?.trim()) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
          "X-Tenant-ID": tenantId.trim(),
        };
        const jwt = tokenStorage.getAccessToken();
        if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

        const res = await fetch(`/api/marketing/dashboard?tenant_id=${encodeURIComponent(tenantId.trim())}`, {
          headers,
          signal: ac.signal,
        });
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        const d = data?.data;
        if (d) {
          const built: KPI[] = [];
          if (d.campaigns?.total != null) built.push({ label: "Campanas", value: String(d.campaigns.total), change: null, color: "#3b82f6" });
          if (d.campaigns?.active != null) built.push({ label: "Campanas Activas", value: String(d.campaigns.active), change: null, color: "#22c55e" });
          if (d.journeys?.total != null) built.push({ label: "Journeys", value: String(d.journeys.total), change: null, color: "#a855f7" });
          if (d.contacts?.total != null) built.push({ label: "Contactos", value: String(d.contacts.total), change: null, color: "#f59e0b" });
          if (d.conversions?.rate != null) built.push({ label: "Conversion", value: `${d.conversions.rate}%`, change: null, color: "#ec4899" });
          if (d.agents?.total != null) built.push({ label: "Agentes IA", value: String(d.agents.total), change: null, color: "#06b6d4" });
          setKpis(built);
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error)?.message ?? "Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [tenantId]);

  return (
    <div style={{ padding: 40, backgroundColor: "#0a0f1c", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", margin: 0 }}>Command Center</h1>
        <p style={{ color: "#94a3b8", marginTop: 8 }}>Vista ejecutiva de todo el sistema de marketing</p>
      </div>

      <MarketingNav />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
          <Loader2 style={{ width: 32, height: 32, color: "#3b82f6" }} className="animate-spin" />
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <BarChart3 style={{ width: 48, height: 48, color: "#374151", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>No se pudieron cargar los datos del dashboard.</p>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{error}</p>
        </div>
      ) : kpis.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <BarChart3 style={{ width: 48, height: 48, color: "#374151", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8", fontSize: 18, fontWeight: 600 }}>Sin datos de marketing</p>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
            Configura tus campanas y fuentes de datos para ver metricas aqui.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(kpis.length, 6)}, 1fr)`, gap: 16, marginBottom: 32 }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{ backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: 12, padding: 16 }}>
                <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{kpi.label}</p>
                <p style={{ color: "#f8fafc", fontSize: 24, fontWeight: 700, margin: "8px 0 4px 0" }}>{kpi.value}</p>
                {kpi.change && (
                  <span style={{ backgroundColor: `${kpi.color}20`, color: kpi.color, padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>
                    {kpi.change}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Channels Performance - empty state until API provides channel breakdown */}
          <h2 style={{ color: "#f8fafc", fontSize: 20, marginBottom: 16 }}>Rendimiento por Canal</h2>
          {channels.length === 0 ? (
            <div style={{ backgroundColor: "rgba(30,41,59,0.5)", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
              <TrendingUp style={{ width: 36, height: 36, color: "#374151", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748b", fontSize: 14 }}>
                Datos de canal no disponibles. Conecta integraciones (Email, Social, SEO, Ads) para ver el rendimiento por canal.
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: "rgba(30,41,59,0.5)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                    {["Canal", "Revenue", "Leads", "Conversion", "Tendencia"].map(h => (
                      <th key={h} style={{ padding: 16, textAlign: "left", color: "#94a3b8", fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channels.map((ch, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(51,65,85,0.3)" }}>
                      <td style={{ padding: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ch.color }} />
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>{ch.name}</span>
                      </td>
                      <td style={{ padding: 16, color: "#22c55e", fontWeight: 600 }}>{ch.revenue}</td>
                      <td style={{ padding: 16, color: "#f8fafc" }}>{ch.leads}</td>
                      <td style={{ padding: 16, color: "#a855f7" }}>{ch.conversion}</td>
                      <td style={{ padding: 16 }}>
                        <div style={{ width: 80, height: 24, background: `linear-gradient(90deg, ${ch.color}40, ${ch.color})`, borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
