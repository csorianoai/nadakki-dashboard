"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Image, Video, Mic, Sparkles, Wand2, Copy, Download,
  RefreshCw, Save, Trash2, Clock, Star, Folder, Search, Filter,
  Plus, ChevronRight, Loader2, Check, X, Zap, Brain, MessageSquare
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CONTENT_TYPES = [
  { id: "email", name: "Email Copy", icon: FileText, color: "#3b82f6", desc: "Subject lines, body copy" },
  { id: "social", name: "Social Posts", icon: MessageSquare, color: "#ec4899", desc: "Twitter, LinkedIn, Instagram" },
  { id: "ad", name: "Ad Copy", icon: Zap, color: "#f59e0b", desc: "Headlines, descriptions" },
  { id: "blog", name: "Blog Posts", icon: FileText, color: "#22c55e", desc: "Articles, SEO content" },
  { id: "product", name: "Product Descriptions", icon: FileText, color: "#8b5cf6", desc: "E-commerce, catalogs" },
  { id: "sms", name: "SMS Messages", icon: MessageSquare, color: "#06b6d4", desc: "Short promotional texts" },
];

const TEMPLATES = [
  { id: "t1", name: "Welcome Email", type: "email", preview: "Welcome to [Brand]! We're thrilled to have you..." },
  { id: "t2", name: "Promo Announcement", type: "social", preview: "🎉 Big news! For the next 48 hours..." },
  { id: "t3", name: "Product Launch", type: "ad", preview: "Introducing the all-new [Product]..." },
  { id: "t4", name: "Newsletter Intro", type: "email", preview: "This week in [Brand]: Top stories and updates..." },
  { id: "t5", name: "Flash Sale SMS", type: "sms", preview: "⚡ FLASH SALE: 50% off everything for 24hrs only!" },
];

const RECENT_CONTENT = [
  { id: "c1", title: "Black Friday Email Campaign", type: "email", created: "2 hours ago", words: 245 },
  { id: "c2", title: "Instagram Product Teaser", type: "social", created: "5 hours ago", words: 42 },
  { id: "c3", title: "Google Ads Headlines", type: "ad", created: "1 day ago", words: 89 },
  { id: "c4", title: "Weekly Newsletter", type: "email", created: "2 days ago", words: 512 },
];

export default function ContentStudioPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  const generateContent = async () => {
    if (!prompt || !selectedType) return;
    setGenerating(true);
    setGeneratedContent("");
    
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2000));
    
    const samples: Record<string, string> = {
      email: `Subject: ${prompt}\n\nHi [First Name],\n\nWe're excited to share something special with you today. As one of our valued customers, you're getting early access to our latest offering.\n\n${prompt}\n\nThis exclusive opportunity is available for a limited time only. Don't miss out on the chance to be among the first to experience what we've been working on.\n\nClick below to learn more and secure your spot.\n\n[CTA Button]\n\nBest regards,\nThe [Brand] Team`,
      social: `🚀 ${prompt}\n\nWe've been working on something BIG and we can't wait to share it with you!\n\n✨ Key highlights:\n• Feature 1\n• Feature 2\n• Feature 3\n\nDrop a 🙌 if you're excited!\n\n#Marketing #Innovation #Growth`,
      ad: `Headline 1: ${prompt} - Limited Time Offer\nHeadline 2: Discover the Secret to ${prompt}\nHeadline 3: Transform Your Results with ${prompt}\n\nDescription 1: Join thousands of satisfied customers. Start your free trial today.\nDescription 2: Award-winning solution trusted by industry leaders. See why.`,
      sms: `[Brand]: ${prompt}! 🎉 Use code SAVE20 for 20% off. Valid 48hrs only. Shop now: [link] Reply STOP to opt out`,
    };
    
    setGeneratedContent(samples[selectedType] || samples.email);
    setGenerating(false);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Content Studio" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Studio</h1>
            <p className="text-gray-400">Genera contenido de marketing con IA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <Folder className="w-4 h-4" /> My Content
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <Star className="w-4 h-4" /> Saved
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="1,247" label="Content Generated" icon={<FileText className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="89%" label="Satisfaction Rate" icon={<Star className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="45K" label="Words This Month" icon={<Sparkles className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="2.3s" label="Avg Generation Time" icon={<Clock className="w-6 h-6 text-green-400" />} color="#22c55e" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Content Types & Templates */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white mb-4">Content Type</h3>
            <div className="space-y-2">
              {CONTENT_TYPES?.map(type => (
                <button key={type.id} onClick={() => setSelectedType(type.id)}
                  className={`w-full p-3 text-left rounded-xl border transition-all flex items-center gap-3 ${
                    selectedType === type.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"
                  }`}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: type.color + "20" }}>
                    <type.icon className="w-4 h-4" style={{ color: type.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white mb-4">Quick Templates</h3>
            <div className="space-y-2">
              {TEMPLATES.filter(t => !selectedType || t.type === selectedType).slice(0, 4).map(t => (
                <button key={t.id} onClick={() => setPrompt(t.preview.substring(0, 50) + "...")}
                  className="w-full p-3 text-left rounded-lg border border-white/10 hover:border-white/20 transition-all">
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-500 truncate">{t.preview}</div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Center: Generator */}
        <div className="col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">AI Content Generator</h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">What do you want to create?</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                placeholder="e.g., A promotional email for our summer sale with 30% discount..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="urgent">Urgent</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Length</label>
                <select value={length} onChange={(e) => setLength(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            <button onClick={generateContent} disabled={generating || !prompt || !selectedType}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Wand2 className="w-5 h-5" /> Generate Content</>}
            </button>
          </GlassCard>

          {generatedContent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Generated Content</h3>
                  <div className="flex gap-2">
                    <button onClick={() => generateContent()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={copyContent} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <pre className="text-white whitespace-pre-wrap font-sans text-sm">{generatedContent}</pre>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-sm text-gray-400">{generatedContent.split(/\s+/).length} words</span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm">
                    <Check className="w-4 h-4" /> Use This Content
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Recent Content */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Content</h3>
            <div className="space-y-3">
              {RECENT_CONTENT?.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-white">{c.title}</div>
                      <div className="text-xs text-gray-500">{c.type} • {c.words} words • {c.created}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

