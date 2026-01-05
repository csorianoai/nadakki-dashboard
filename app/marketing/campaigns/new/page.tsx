"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, ChevronRight, Check, Save, Play, X,
  Mail, MessageSquare, Bell, Smartphone, Image, Globe, Plus,
  Calendar, Users, Target, BarChart3, FileText, Settings,
  Loader2, Copy, Tag, Clock, Zap, Eye, Edit, Trash2
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const STEPS = [
  { id: 1, name: "Compose", label: "Compose Messages", icon: FileText },
  { id: 2, name: "Schedule", label: "Schedule Delivery", icon: Calendar },
  { id: 3, name: "Target", label: "Target Audiences", icon: Users },
  { id: 4, name: "Assign", label: "Assign Conversions", icon: Target },
  { id: 5, name: "Review", label: "Review Summary", icon: Check },
];

const CAMPAIGN_TYPES: Record<string, { icon: any; color: string; label: string }> = {
  email: { icon: Mail, color: "#3b82f6", label: "Email" },
  sms: { icon: MessageSquare, color: "#22c55e", label: "SMS" },
  push: { icon: Bell, color: "#f59e0b", label: "Push Notification" },
  "in-app": { icon: Smartphone, color: "#8b5cf6", label: "In-App Message" },
  banner: { icon: Image, color: "#ec4899", label: "Banner" },
  whatsapp: { icon: MessageSquare, color: "#25D366", label: "WhatsApp" },
};

const MESSAGE_TEMPLATES = [
  { id: "welcome", name: "Welcome Message", preview: "Welcome to our platform!" },
  { id: "promo", name: "Promotional Offer", preview: "Get 20% off today!" },
  { id: "reminder", name: "Reminder", preview: "Don't forget to complete..." },
  { id: "referral", name: "Referral Program", preview: "Refer a friend and earn..." },
  { id: "survey", name: "Survey Request", preview: "We'd love your feedback!" },
];

const SEGMENTS = [
  { id: "all", name: "All Users", count: 125000 },
  { id: "active", name: "Active Users (30 days)", count: 45000 },
  { id: "new", name: "New Users (7 days)", count: 8500 },
  { id: "churned", name: "At Risk of Churn", count: 12000 },
  { id: "vip", name: "VIP Customers", count: 3200 },
  { id: "engaged", name: "Highly Engaged", count: 28000 },
];

const CONVERSION_EVENTS = [
  { id: "purchase", name: "Made a Purchase", icon: "💰" },
  { id: "signup", name: "Completed Signup", icon: "✅" },
  { id: "upgrade", name: "Upgraded Plan", icon: "⬆️" },
  { id: "referral", name: "Referred a Friend", icon: "👥" },
  { id: "review", name: "Left a Review", icon: "⭐" },
];

function CampaignWizardContent() {
  const searchParams = useSearchParams();
  const campaignType = searchParams.get("type") || "email";
  const typeConfig = CAMPAIGN_TYPES[campaignType] || CAMPAIGN_TYPES.email;
  const TypeIcon = typeConfig.icon;

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState({
    name: "",
    description: "",
    type: campaignType,
    tags: [] as string[],
    variants: [{ id: "v1", name: "Variant 1", content: "" }],
    selectedTemplate: "",
    scheduleType: "immediate" as "immediate" | "scheduled" | "action-based" | "recurring",
    scheduledDate: "",
    scheduledTime: "",
    timezone: "America/New_York",
    recurringFrequency: "daily",
    targetSegments: [] as string[],
    excludeSegments: [] as string[],
    conversionEvents: [] as string[],
    conversionWindow: 7,
  });

  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const generateCampaignId = () => `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

  const updateCampaign = (field: string, value: any) => {
    setCampaign(prev => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    const newVariant = { id: `v${campaign.variants.length + 1}`, name: `Variant ${campaign.variants.length + 1}`, content: "" };
    updateCampaign("variants", [...campaign.variants, newVariant]);
  };

  const addTag = () => {
    if (newTag && !campaign.tags.includes(newTag)) {
      updateCampaign("tags", [...campaign.tags, newTag]);
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const removeTag = (tag: string) => {
    updateCampaign("tags", campaign.tags.filter(t => t !== tag));
  };

  const toggleSegment = (segmentId: string) => {
    const current = campaign.targetSegments;
    if (current.includes(segmentId)) {
      updateCampaign("targetSegments", current.filter(s => s !== segmentId));
    } else {
      updateCampaign("targetSegments", [...current, segmentId]);
    }
  };

  const toggleConversion = (eventId: string) => {
    const current = campaign.conversionEvents;
    if (current.includes(eventId)) {
      updateCampaign("conversionEvents", current.filter(e => e !== eventId));
    } else {
      updateCampaign("conversionEvents", [...current, eventId]);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
  };

  const launchCampaign = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    window.location.href = "/marketing/campaigns";
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return campaign.name.length > 0;
      case 2: return campaign.scheduleType === "immediate" || campaign.scheduledDate;
      case 3: return campaign.targetSegments.length > 0;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const getEstimatedReach = () => {
    return campaign.targetSegments.reduce((acc, segId) => {
      const seg = SEGMENTS.find(s => s.id === segId);
      return acc + (seg?.count || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {/* Header */}
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-[#0d1117]">
        <div className="flex items-center gap-4">
          <Link href="/marketing/campaigns" className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: typeConfig.color + "20" }}>
              <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
            </div>
            <div>
              <input type="text" value={campaign.name} onChange={(e) => updateCampaign("name", e.target.value)}
                placeholder="Campaign Name" className="text-lg font-bold bg-transparent border-none text-white focus:outline-none w-64" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{typeConfig.label}</span>
                {campaign.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1">
                    {tag}<button onClick={() => removeTag(tag)}><X className="w-2 h-2" /></button>
                  </span>
                ))}
                {showTagInput ? (
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()} onBlur={() => { addTag(); setShowTagInput(false); }}
                    placeholder="Tag" autoFocus className="px-2 py-0.5 bg-white/10 rounded text-xs text-white w-20 focus:outline-none" />
                ) : (
                  <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400">
                    <Tag className="w-3 h-3" /> Tags
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveDraft} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save as Draft
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b border-white/10 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button onClick={() => setCurrentStep(step.id)} className={`flex flex-col items-center gap-2 ${isCurrent ? "opacity-100" : "opacity-60 hover:opacity-80"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-green-500" : isCurrent ? "bg-purple-500" : "bg-white/10"}`}>
                      {isCompleted ? <Check className="w-5 h-5 text-white" /> : <span className="text-white font-bold">{step.id}</span>}
                    </div>
                    <span className={`text-sm font-medium ${isCurrent ? "text-white" : "text-gray-400"}`}>{step.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`w-24 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Campaign Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Campaign Name</label>
                    <input type="text" value={campaign.name} onChange={(e) => updateCampaign("name", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" placeholder="e.g., Welcome Series" />
                  </div>
                  <button className="text-purple-400 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add description</button>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Campaign ID</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={generateCampaignId()} readOnly className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 font-mono text-sm" />
                      <button className="px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</button>
                    </div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Message Composer</h2>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 block mb-2">Variants</label>
                  <div className="flex items-center gap-2">
                    {campaign.variants.map((v, i) => (
                      <button key={v.id} className={`px-4 py-2 rounded-lg border ${i === 0 ? "border-purple-500 bg-purple-500/20 text-white" : "border-white/10 text-gray-400"}`}>{v.name}</button>
                    ))}
                    <button onClick={addVariant} className="p-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-48 space-y-2">
                    {MESSAGE_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => updateCampaign("selectedTemplate", t.id)}
                        className={`w-full p-3 text-left rounded-lg border ${campaign.selectedTemplate === t.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}>
                        <div className="text-sm text-white font-medium">{t.name}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="w-72 h-[400px] bg-gray-900 rounded-3xl border-4 border-gray-700 p-2">
                      <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                        <div className="text-center p-6">
                          <TypeIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-800 mb-2">Preview</h3>
                          <p className="text-sm text-gray-500">{MESSAGE_TEMPLATES.find(t => t.id === campaign.selectedTemplate)?.preview || "Select a template"}</p>
                          <button className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg text-sm">Action</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">Schedule Delivery</h2>
                <div className="space-y-4">
                  {[
                    { id: "immediate", label: "Send Immediately", desc: "Send as soon as launched", icon: Zap },
                    { id: "scheduled", label: "Schedule for Later", desc: "Choose date and time", icon: Calendar },
                    { id: "action-based", label: "Action-Based", desc: "Trigger on user action", icon: Target },
                    { id: "recurring", label: "Recurring", desc: "Send on schedule", icon: Clock },
                  ].map(o => (
                    <button key={o.id} onClick={() => updateCampaign("scheduleType", o.id)}
                      className={`w-full p-4 text-left rounded-xl border flex items-start gap-4 ${campaign.scheduleType === o.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}>
                      <div className={`p-3 rounded-lg ${campaign.scheduleType === o.id ? "bg-purple-500" : "bg-white/10"}`}><o.icon className="w-5 h-5 text-white" /></div>
                      <div><div className="text-white font-medium">{o.label}</div><div className="text-sm text-gray-400">{o.desc}</div></div>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${campaign.scheduleType === o.id ? "border-purple-500 bg-purple-500" : "border-white/20"}`}>
                        {campaign.scheduleType === o.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                {campaign.scheduleType === "scheduled" && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-gray-400 block mb-2">Date</label><input type="date" value={campaign.scheduledDate} onChange={(e) => updateCampaign("scheduledDate", e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" /></div>
                    <div><label className="text-sm text-gray-400 block mb-2">Time</label><input type="time" value={campaign.scheduledTime} onChange={(e) => updateCampaign("scheduledTime", e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" /></div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Target Audiences</h2>
                <p className="text-gray-400 mb-6">Select segments to target</p>
                <div className="grid grid-cols-2 gap-4">
                  {SEGMENTS.map(s => (
                    <button key={s.id} onClick={() => toggleSegment(s.id)}
                      className={`p-4 text-left rounded-xl border ${campaign.targetSegments.includes(s.id) ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{s.name}</span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${campaign.targetSegments.includes(s.id) ? "border-purple-500 bg-purple-500" : "border-white/20"}`}>
                          {campaign.targetSegments.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">{s.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">users</div>
                    </button>
                  ))}
                </div>
                {campaign.targetSegments.length > 0 && (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-gray-400">Estimated Reach</span>
                    <span className="text-2xl font-bold text-white">{getEstimatedReach().toLocaleString()} users</span>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Assign Conversion Events</h2>
                <p className="text-gray-400 mb-6">Track actions after campaign (optional)</p>
                <div className="space-y-3">
                  {CONVERSION_EVENTS.map(e => (
                    <button key={e.id} onClick={() => toggleConversion(e.id)}
                      className={`w-full p-4 text-left rounded-xl border flex items-center gap-4 ${campaign.conversionEvents.includes(e.id) ? "border-green-500 bg-green-500/10" : "border-white/10 hover:border-white/20"}`}>
                      <span className="text-2xl">{e.icon}</span>
                      <span className="text-white font-medium flex-1">{e.name}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${campaign.conversionEvents.includes(e.id) ? "border-green-500 bg-green-500" : "border-white/20"}`}>
                        {campaign.conversionEvents.includes(e.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <label className="text-sm text-gray-400 block mb-2">Conversion Window</label>
                  <select value={campaign.conversionWindow} onChange={(e) => updateCampaign("conversionWindow", parseInt(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                    <option value={1}>1 day</option><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option>
                  </select>
                </div>
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-6">Review Campaign</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between"><div><div className="text-sm text-gray-400">Name</div><div className="text-white font-medium">{campaign.name || "Untitled"}</div></div><button onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">Edit</button></div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between"><div><div className="text-sm text-gray-400">Type</div><div className="flex items-center gap-2"><TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} /><span className="text-white">{typeConfig.label}</span></div></div></div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between"><div><div className="text-sm text-gray-400">Schedule</div><div className="text-white capitalize">{campaign.scheduleType.replace("-", " ")}</div></div><button onClick={() => setCurrentStep(2)} className="text-purple-400 text-sm">Edit</button></div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between"><div><div className="text-sm text-gray-400">Audience</div><div className="text-white">{campaign.targetSegments.length} segments</div><div className="text-2xl font-bold text-purple-400">{getEstimatedReach().toLocaleString()} users</div></div><button onClick={() => setCurrentStep(3)} className="text-purple-400 text-sm">Edit</button></div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between"><div><div className="text-sm text-gray-400">Conversions</div><div className="text-white">{campaign.conversionEvents.length} events • {campaign.conversionWindow} days</div></div><button onClick={() => setCurrentStep(4)} className="text-purple-400 text-sm">Edit</button></div>
                </div>
              </GlassCard>
              <div className="flex justify-center">
                <button onClick={launchCampaign} disabled={saving} className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />} {saving ? "Launching..." : "Launch Campaign"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-[#0d1117] px-4 flex items-center justify-between">
        <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-6">
          {STEPS.map(s => (
            <button key={s.id} onClick={() => setCurrentStep(s.id)} className={`flex items-center gap-2 ${currentStep === s.id ? "text-white" : "text-gray-500"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep > s.id ? "bg-green-500 text-white" : currentStep === s.id ? "bg-purple-500 text-white" : "bg-white/10"}`}>
                {currentStep > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className="text-sm hidden md:block">{s.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {currentStep < 5 ? (
            <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={saveDraft} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium">Save Draft</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    }>
      <CampaignWizardContent />
    </Suspense>
  );
}
