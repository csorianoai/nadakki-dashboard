"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Bell, Shield, Palette, Globe, 
  Database, Key, Save, Check
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const TABS = [
  { id: "general", name: "General", icon: Settings },
  { id: "notifications", name: "Notificaciones", icon: Bell },
  { id: "security", name: "Seguridad", icon: Shield },
  { id: "appearance", name: "Apariencia", icon: Palette },
  { id: "api", name: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "CrediCefi",
    timezone: "America/Mexico_City",
    language: "es",
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    twoFactor: false,
    theme: "dark",
    apiKey: "sk-nadakki-xxxx-xxxx-xxxx",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${saved ? "bg-green-500 text-white" : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white"}`}
        >
          {saved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar</>}
        </motion.button>
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <Settings className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Configuración</h1>
            <p className="text-gray-400">Ajustes generales del sistema y preferencias</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="col-span-1">
          <GlassCard className="p-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id ? "bg-purple-500/20 text-white" : "text-gray-400 hover:bg-white/5"}`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-purple-400" : ""}`} />
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content */}
        <div className="col-span-3">
          <GlassCard className="p-6">
            {activeTab === "general" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Configuración General</h3>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Zona Horaria</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                    >
                      <option value="America/Mexico_City">Ciudad de México</option>
                      <option value="America/New_York">New York</option>
                      <option value="Europe/Madrid">Madrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Idioma</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Notificaciones</h3>
                {[
                  { key: "emailNotifications", label: "Notificaciones por Email", desc: "Recibe alertas importantes por email" },
                  { key: "pushNotifications", label: "Notificaciones Push", desc: "Alertas en tiempo real en el navegador" },
                  { key: "weeklyReports", label: "Reportes Semanales", desc: "Resumen semanal de actividad" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
                      className={`w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? "bg-purple-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "api" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">API Keys</h3>
                <div className="p-4 bg-white/5 rounded-xl">
                  <label className="text-sm text-gray-400 mb-2 block">API Key Principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={settings.apiKey}
                      readOnly
                      className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
                    />
                    <button className="px-4 py-3 bg-purple-500 rounded-xl text-white font-medium">Copiar</button>
                  </div>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-400 text-sm">⚠️ Nunca compartas tu API key. Si crees que fue comprometida, regenera una nueva.</p>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
