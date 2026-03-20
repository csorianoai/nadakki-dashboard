"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Loader2, CheckCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { campaignsAPI, type CampaignType } from "@/lib/api";
import { useTenant } from "@/contexts/TenantContext";

const CHANNELS: { value: CampaignType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "in-app", label: "In-App" },
  { value: "multi-channel", label: "Multi-canal" },
];

export default function CampaignsNewPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("email");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const campaign = await campaignsAPI.create({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        tenant_id: tenantId || "default",
      } as Partial<import("@/lib/api").Campaign>);
      setSuccess(true);
      setTimeout(() => {
        if (campaign?.id) {
          router.push(`/marketing/campaigns/${campaign.id}`);
        } else {
          router.push("/campaigns");
        }
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns"><StatusBadge status="active" label="Nueva Campana" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Plus className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Nueva Campana</h1><p className="text-gray-400">Crea una nueva campana de marketing</p></div>
        </div>
      </motion.div>

      {success ? (
        <GlassCard className="p-8 max-w-2xl text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Campana creada</h2>
          <p className="text-gray-400">Redirigiendo al detalle...</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Nombre de la campana</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Promocion Verano 2025"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Canal</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => (
                  <button key={ch.value} onClick={() => setType(ch.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${type === ch.value ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Descripcion (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el objetivo de la campana..."
                rows={3}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none" />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreate} disabled={creating || !name.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white ${creating || !name.trim() ? "bg-gray-600" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
              {creating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Creando...</span> : "Crear Campana"}
            </motion.button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
