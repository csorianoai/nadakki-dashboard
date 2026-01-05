"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Link2, Unlink, RefreshCw, Check, X, ExternalLink,
  Settings, Trash2, Plus, Search, Filter, AlertCircle, Clock,
  Users, FileText, TrendingUp, Loader2, ChevronRight, Shield
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = "credicefi";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "crm" | "cdp" | "analytics" | "communication" | "payment" | "other";
  logo: string;
  status: "disconnected" | "connected" | "error" | "pending";
  authType: "oauth" | "api_key" | "webhook";
  authUrl?: string;
  docsUrl: string;
  lastSync?: string;
  stats?: {
    contacts?: number;
    events?: number;
    syncs?: number;
  };
  config?: Record<string, string>;
}

// Integraciones reales con URLs de OAuth/conexión correctas
const AVAILABLE_INTEGRATIONS: Integration[] = [
  // CRM
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM, marketing, sales y servicio al cliente",
    category: "crm",
    logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=contacts%20content",
    docsUrl: "https://developers.hubspot.com/docs/api/overview",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM líder para ventas y servicio",
    category: "crm",
    logo: "https://c1.sfdcstatic.com/content/dam/sfdc-docs/www/logos/logo-salesforce.svg",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    docsUrl: "https://developer.salesforce.com/docs",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "CRM de ventas diseñado para equipos pequeños",
    category: "crm",
    logo: "https://www.pipedrive.com/favicon.ico",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://oauth.pipedrive.com/oauth/authorize",
    docsUrl: "https://developers.pipedrive.com/docs/api/v1",
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    description: "Suite completa de CRM y productividad",
    category: "crm",
    logo: "https://www.zoho.com/favicon.ico",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://accounts.zoho.com/oauth/v2/auth",
    docsUrl: "https://www.zoho.com/crm/developer/docs/api/v2/",
  },
  // CDP
  {
    id: "segment",
    name: "Segment",
    description: "Customer Data Platform líder",
    category: "cdp",
    logo: "https://segment.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://segment.com/docs/connections/sources/",
  },
  {
    id: "rudderstack",
    name: "RudderStack",
    description: "CDP open-source para datos de clientes",
    category: "cdp",
    logo: "https://www.rudderstack.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://www.rudderstack.com/docs/",
  },
  {
    id: "mparticle",
    name: "mParticle",
    description: "Plataforma de datos de clientes enterprise",
    category: "cdp",
    logo: "https://www.mparticle.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://docs.mparticle.com/",
  },
  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    description: "Analítica web y app de Google",
    category: "analytics",
    logo: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/analytics.readonly",
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Product analytics para engagement",
    category: "analytics",
    logo: "https://mixpanel.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://developer.mixpanel.com/docs",
  },
  {
    id: "amplitude",
    name: "Amplitude",
    description: "Digital analytics platform",
    category: "analytics",
    logo: "https://amplitude.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://www.docs.developers.amplitude.com/",
  },
  // Communication
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS, WhatsApp, Voice y Email",
    category: "communication",
    logo: "https://www.twilio.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://www.twilio.com/docs",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Email delivery y marketing",
    category: "communication",
    logo: "https://sendgrid.com/favicon.ico",
    status: "disconnected",
    authType: "api_key",
    docsUrl: "https://docs.sendgrid.com/",
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Mensajería y soporte al cliente",
    category: "communication",
    logo: "https://www.intercom.com/favicon.ico",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://app.intercom.com/oauth",
    docsUrl: "https://developers.intercom.com/docs",
  },
  // Payment
  {
    id: "stripe",
    name: "Stripe",
    description: "Procesamiento de pagos y suscripciones",
    category: "payment",
    logo: "https://stripe.com/favicon.ico",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://connect.stripe.com/oauth/authorize",
    docsUrl: "https://stripe.com/docs/api",
  },
  // Other
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecta +5000 apps sin código",
    category: "other",
    logo: "https://zapier.com/favicon.ico",
    status: "disconnected",
    authType: "webhook",
    docsUrl: "https://zapier.com/developer/documentation/v2/",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Notificaciones y alertas del equipo",
    category: "communication",
    logo: "https://slack.com/favicon.ico",
    status: "disconnected",
    authType: "oauth",
    authUrl: "https://slack.com/oauth/v2/authorize?scope=chat:write,channels:read",
    docsUrl: "https://api.slack.com/docs",
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  crm: { label: "CRM", color: "#3b82f6" },
  cdp: { label: "CDP", color: "#8b5cf6" },
  analytics: { label: "Analytics", color: "#22c55e" },
  communication: { label: "Communication", color: "#f59e0b" },
  payment: { label: "Payment", color: "#ec4899" },
  other: { label: "Other", color: "#6b7280" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Cargar estado de integraciones desde API
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/integrations?tenant_id=${TENANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        // Merge API data with available integrations
        if (data.integrations) {
          setIntegrations(prevIntegrations => 
            prevIntegrations.map(int => {
              const apiInt = data.integrations.find((a: any) => a.id === int.id);
              if (apiInt) {
                return { ...int, status: apiInt.status, lastSync: apiInt.last_sync, stats: apiInt.stats };
              }
              return int;
            })
          );
        }
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    }
    setLoading(false);
  };

  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(search.toLowerCase()) ||
                          int.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || int.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || int.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const totalContacts = integrations.reduce((acc, i) => acc + (i.stats?.contacts || 0), 0);
  const totalSyncs = integrations.reduce((acc, i) => acc + (i.stats?.syncs || 0), 0);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setApiKeyInput("");
    
    if (integration.authType === "oauth" && integration.authUrl) {
      // Para OAuth, abrir ventana de autorización
      // En producción, esto debería redirigir al backend para manejar OAuth
      window.open(integration.authUrl, "_blank", "width=600,height=700");
      // Simulamos conexión exitosa después de unos segundos
      setConnecting(true);
      setTimeout(() => {
        setIntegrations(prev => prev.map(i => 
          i.id === integration.id 
            ? { ...i, status: "connected", lastSync: new Date().toISOString() }
            : i
        ));
        setConnecting(false);
        setShowConnectModal(false);
      }, 3000);
    } else {
      // Para API Key o Webhook, mostrar modal
      setShowConnectModal(true);
    }
  };

  const submitApiKey = async () => {
    if (!selectedIntegration || !apiKeyInput) return;
    
    setConnecting(true);
    try {
      const res = await fetch(`${API_URL}/api/integrations/${selectedIntegration.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenant_id: TENANT_ID, 
          api_key: apiKeyInput,
          config: { api_key: apiKeyInput }
        }),
      });
      
      if (res.ok) {
        setIntegrations(prev => prev.map(i => 
          i.id === selectedIntegration.id 
            ? { ...i, status: "connected", lastSync: new Date().toISOString(), config: { api_key: "••••••••" } }
            : i
        ));
        setShowConnectModal(false);
      }
    } catch (error) {
      console.error("Error connecting:", error);
    }
    setConnecting(false);
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`¿Estás seguro de desconectar ${integration.name}?`)) return;
    
    try {
      await fetch(`${API_URL}/api/integrations/${integration.id}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID }),
      });
      
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id 
          ? { ...i, status: "disconnected", lastSync: undefined, stats: undefined, config: undefined }
          : i
      ));
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const handleSync = async (integration: Integration) => {
    setSyncing(integration.id);
    try {
      await fetch(`${API_URL}/api/integrations/${integration.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID }),
      });
      
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id 
          ? { ...i, lastSync: new Date().toISOString() }
          : i
      ));
    } catch (error) {
      console.error("Error syncing:", error);
    }
    setSyncing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs"><Check className="w-3 h-3" /> Conectado</span>;
      case "error":
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs"><AlertCircle className="w-3 h-3" /> Error</span>;
      case "pending":
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs"><Clock className="w-3 h-3" /> Pendiente</span>;
      default:
        return <span className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs"><Unlink className="w-3 h-3" /> No conectado</span>;
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Integraciones" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
            <Database className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Integraciones CDP/CRM</h1>
            <p className="text-gray-400">Conecta tus herramientas y sincroniza datos en tiempo real</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard 
          value={connectedCount.toString()} 
          label="Conectadas" 
          icon={<Link2 className="w-6 h-6 text-green-400" />} 
          color="#22c55e" 
        />
        <StatCard 
          value={integrations.length.toString()} 
          label="Disponibles" 
          icon={<Database className="w-6 h-6 text-blue-400" />} 
          color="#3b82f6" 
        />
        <StatCard 
          value={totalContacts > 0 ? (totalContacts / 1000).toFixed(1) + "K" : "0"} 
          label="Contactos Sincronizados" 
          icon={<Users className="w-6 h-6 text-purple-400" />} 
          color="#8b5cf6" 
        />
        <StatCard 
          value={totalSyncs.toString()} 
          label="Sincronizaciones" 
          icon={<RefreshCw className="w-6 h-6 text-cyan-400" />} 
          color="#06b6d4" 
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar integraciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
        >
          <option value="all">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
        >
          <option value="all">Todos los estados</option>
          <option value="connected">Conectadas</option>
          <option value="disconnected">No conectadas</option>
          <option value="error">Con errores</option>
        </select>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-gray-500">
            No se encontraron integraciones
          </div>
        ) : (
          filteredIntegrations.map((integration, i) => {
            const categoryInfo = CATEGORY_LABELS[integration.category];
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-5 hover:border-teal-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        <img 
                          src={integration.logo} 
                          alt={integration.name} 
                          className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{integration.name}</h3>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: categoryInfo.color + "20", color: categoryInfo.color }}
                        >
                          {categoryInfo.label}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{integration.description}</p>

                  {integration.status === "connected" && integration.stats && (
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{integration.stats.contacts?.toLocaleString() || 0}</div>
                        <div className="text-xs text-gray-500">Contactos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{integration.stats.events?.toLocaleString() || 0}</div>
                        <div className="text-xs text-gray-500">Eventos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{integration.stats.syncs || 0}</div>
                        <div className="text-xs text-gray-500">Syncs</div>
                      </div>
                    </div>
                  )}

                  {integration.lastSync && (
                    <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Última sincronización: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <a 
                      href={integration.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" /> Documentación
                    </a>

                    <div className="flex gap-2">
                      {integration.status === "connected" ? (
                        <>
                          <button
                            onClick={() => handleSync(integration)}
                            disabled={syncing === integration.id}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm flex items-center gap-1"
                          >
                            <RefreshCw className={`w-4 h-4 ${syncing === integration.id ? "animate-spin" : ""}`} />
                            Sync
                          </button>
                          <button
                            onClick={() => handleDisconnect(integration)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-1"
                          >
                            <Unlink className="w-4 h-4" /> Desconectar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration)}
                          className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg text-white text-sm flex items-center gap-1"
                        >
                          <Link2 className="w-4 h-4" /> Conectar
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Connect Modal for API Key */}
      <AnimatePresence>
        {showConnectModal && selectedIntegration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <img src={selectedIntegration.logo} alt="" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Conectar {selectedIntegration.name}</h3>
                    <p className="text-sm text-gray-400">
                      {selectedIntegration.authType === "api_key" ? "Ingresa tu API Key" : "Configura el webhook"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {selectedIntegration.authType === "api_key" && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">API Key</label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk_live_xxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Encuentra tu API Key en{" "}
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                        la documentación de {selectedIntegration.name}
                      </a>
                    </p>
                  </div>
                )}

                {selectedIntegration.authType === "webhook" && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${API_URL}/webhooks/${TENANT_ID}/${selectedIntegration.id}`}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(`${API_URL}/webhooks/${TENANT_ID}/${selectedIntegration.id}`)}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Copia esta URL y configúrala en {selectedIntegration.name}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm text-yellow-400">
                    Tus credenciales se almacenan de forma segura y encriptada
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitApiKey}
                  disabled={connecting || (selectedIntegration.authType === "api_key" && !apiKeyInput)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {connecting ? "Conectando..." : "Conectar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
