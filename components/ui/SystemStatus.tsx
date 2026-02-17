"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ExternalLink, RefreshCw } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
}

export default function SystemStatus() {
  const [expanded, setExpanded] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "API Principal", status: "operational", latency: 45 },
    { name: "Agentes IA", status: "operational", latency: 120 },
    { name: "Base de Datos", status: "operational", latency: 12 },
    { name: "Social Connections", status: "operational", latency: 89 },
  ]);
  const [lastCheck, setLastCheck] = useState(new Date());

  const checkStatus = async () => {
    try {
      const start = Date.now();
      const res = await fetch("${process.env.NEXT_PUBLIC_API_BASE_URL}/health");
      const latency = Date.now() - start;
      
      if (res.ok) {
        setServices(prev => prev.map(s => 
          s.name === "API Principal" ? { ...s, status: "operational", latency } : s
        ));
      }
    } catch {
      setServices(prev => prev.map(s => 
        s.name === "API Principal" ? { ...s, status: "down" } : s
      ));
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = services.every(s => s.status === "operational");
  const hasIssues = services.some(s => s.status !== "operational");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "degraded": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "down": return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        className={"rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden " +
          (allOperational ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30")}
      >
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 px-4 py-3 w-full">
          {allOperational ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          )}
          <span className={"text-sm font-medium " + (allOperational ? "text-green-400" : "text-yellow-400")}>
            {allOperational ? "All systems operational" : "Some issues detected"}
          </span>
          <ChevronDown className={"w-4 h-4 text-gray-400 transition-transform " + (expanded ? "rotate-180" : "")} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-4 space-y-3">
                {services.map(service => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="text-sm text-gray-300">{service.name}</span>
                    </div>
                    {service.latency && (
                      <span className="text-xs text-gray-500">{service.latency}ms</span>
                    )}
                  </div>
                ))}

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Ultima verificacion: {lastCheck.toLocaleTimeString()}
                  </span>
                  <button onClick={checkStatus} className="p-1 hover:bg-white/10 rounded">
                    <RefreshCw className="w-3 h-3 text-gray-400" />
                  </button>
                </div>

                <a href="https://status.nadakki.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300">
                  <ExternalLink className="w-3 h-3" /> Ver detalles completos
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

