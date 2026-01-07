"use client";
import { useState, useEffect, memo } from "react";
import { Activity, Users, Zap, Eye } from "lucide-react";
import { analyticsAPI } from "@/lib/api";

interface Props {
  theme: any;
  tenantId?: string;
}

const RealtimeMetrics = memo(function RealtimeMetrics({ theme, tenantId = "default" }: Props) {
  const [data, setData] = useState<any>(null);
  const isLight = theme?.isLight;
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  useEffect(() => {
    let mounted = true;
    const fetchRealtime = async () => {
      try {
        const result = await analyticsAPI.getRealtime(tenantId);
        if (mounted) setData(result);
      } catch (err) {
        console.error("Realtime fetch failed:", err);
      }
    };
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [tenantId]);

  if (!data) return null;

  const metrics = [
    { label: "Usuarios activos", value: data.active_users || 0, icon: Users, color: "#10b981" },
    { label: "Eventos/min", value: data.events_per_minute || 0, icon: Zap, color: accentPrimary },
    { label: "Sesiones/min", value: data.sessions_per_minute || 0, icon: Activity, color: "#f59e0b" },
    { label: "Top page", value: data.top_pages?.[0]?.users || 0, icon: Eye, color: "#06b6d4" },
  ];

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium" style={{ color: textMuted }}>EN VIVO</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <m.icon className="w-5 h-5 mx-auto mb-1" style={{ color: m.color }} />
            <div className="text-lg font-bold" style={{ color: textPrimary }}>{m.value.toLocaleString()}</div>
            <div className="text-xs" style={{ color: textMuted }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RealtimeMetrics;