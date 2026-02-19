"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Trash2, Copy, Loader2, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface ApiKeyItem {
  id?: string;
  prefix: string;
  name: string;
  active: boolean;
  created_at: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState("credicefi");
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newKeyModal, setNewKeyModal] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  const fetchKeys = () => {
    setLoading(true);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.keys || d?.data?.keys || d || [];
        setKeys(Array.isArray(list) ? list : []);
      })
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, [tenantId]);

  const handleGenerate = () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
      .then((r) => r.json())
      .then((d) => {
        const key = d?.key || d?.api_key || d?.data?.key;
        if (key) {
          setNewKeyModal(key);
          setNewKeyName("");
          fetchKeys();
        }
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  };

  const handleDelete = (keyId: string) => {
    setDeleting(keyId);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys/${keyId}`, { method: "DELETE" })
      .then((r) => r.ok && fetchKeys())
      .catch(() => {})
      .finally(() => setDeleting(null));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
        >
          <option value="credicefi">credicefi</option>
          <option value="default">default</option>
        </select>
        <button
          onClick={fetchKeys}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">API Keys</h1>
        <p className="text-gray-400 mt-1">Gestiona las claves API del tenant</p>
      </motion.div>

      <GlassCard className="p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Nombre de la nueva key"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 w-64"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !newKeyName.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate New Key
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Keys existentes</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : keys.length === 0 ? (
          <p className="text-gray-500 py-4">No hay API keys configuradas</p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.prefix + k.created_at}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div>
                  <span className="font-mono text-amber-400">{k.prefix}...</span>
                  <span className="text-gray-400 ml-2">{k.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${k.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {k.active ? "active" : "inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{k.created_at}</span>
                  <button
                    onClick={() => handleDelete(k.id || k.prefix)}
                    disabled={!!deleting}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                  >
                    {deleting === (k.id || k.prefix) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modal: nueva key completa (solo una vez) */}
      {newKeyModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setNewKeyModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold text-white mb-2">Tu nueva API Key</h3>
            <p className="text-gray-400 text-sm mb-4">Guárdala ahora. No se mostrará de nuevo.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={newKeyModal}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-amber-400 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(newKeyModal)}
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <button
              onClick={() => setNewKeyModal(null)}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
