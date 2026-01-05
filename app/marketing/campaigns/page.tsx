"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Plus, Search, Filter, Columns, X, Mail, MessageSquare, Bell, 
  Smartphone, Globe, Image, MoreVertical, Play, Pause, Trash2,
  Copy, Edit, Calendar, Users, TrendingUp, ChevronDown, RefreshCw,
  Loader2, HelpCircle, Megaphone
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = "credicefi";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  type: "email" | "sms" | "push" | "in-app" | "banner" | "multichannel" | "whatsapp";
  schedule: "one-time" | "action-based" | "recurring";
  sent: number;
  stopDate?: string;
  createdAt: string;
  tags: string[];
}

const CAMPAIGN_TYPES = {
  email: { icon: Mail, color: "#3b82f6", label: "Email" },
  sms: { icon: MessageSquare, color: "#22c55e", label: "SMS" },
  push: { icon: Bell, color: "#f59e0b", label: "Push" },
  "in-app": { icon: Smartphone, color: "#8b5cf6", label: "In-App Message" },
  banner: { icon: Image, color: "#ec4899", label: "Banner" },
  multichannel: { icon: Megaphone, color: "#06b6d4", label: "Multichannel" },
  whatsapp: { icon: MessageSquare, color: "#25D366", label: "WhatsApp" },
};

const SAMPLE_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Referral Banner", status: "draft", type: "banner", schedule: "one-time", sent: 0, createdAt: "2024-01-15", tags: ["promo"] },
  { id: "c2", name: "Email Drag & Drop Tour", status: "draft", type: "email", schedule: "action-based", sent: 0, createdAt: "2024-01-14", tags: ["onboarding"] },
  { id: "c3", name: "Weekly Newsletter", status: "draft", type: "multichannel", schedule: "recurring", sent: 0, createdAt: "2024-01-13", tags: ["newsletter"] },
  { id: "c4", name: "Onboarding IAM", status: "draft", type: "in-app", schedule: "action-based", sent: 0, createdAt: "2024-01-12", tags: ["onboarding"] },
  { id: "c5", name: "Abandoned Onboarding", status: "draft", type: "whatsapp", schedule: "one-time", sent: 0, createdAt: "2024-01-11", tags: ["retention"] },
  { id: "c6", name: "Black Friday Promo", status: "active", type: "email", schedule: "one-time", sent: 15420, createdAt: "2024-01-10", tags: ["promo", "sale"] },
  { id: "c7", name: "Welcome Series", status: "active", type: "email", schedule: "action-based", sent: 8750, createdAt: "2024-01-09", tags: ["onboarding"] },
  { id: "c8", name: "Push Notification Test", status: "paused", type: "push", schedule: "one-time", sent: 2340, createdAt: "2024-01-08", tags: ["test"] },
  { id: "c9", name: "SMS Reminder", status: "completed", type: "sms", schedule: "recurring", sent: 45000, createdAt: "2024-01-07", tags: ["reminder"] },
];

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SAMPLE_CAMPAIGNS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesTag = !tagFilter || c.tags.includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  });

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    if (filter.startsWith("Status:")) setStatusFilter("all");
    if (filter.startsWith("Tag:")) setTagFilter("");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-500/20 text-gray-400",
      active: "bg-green-500/20 text-green-400",
      paused: "bg-yellow-500/20 text-yellow-400",
      completed: "bg-blue-500/20 text-blue-400",
    };
    return styles[status] || styles.draft;
  };

  const allTags = [...new Set(campaigns.flatMap(c => c.tags))];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Campaigns" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Campaigns</h1>
            <p className="text-gray-400 mt-1">
              Campaigns let you send a single, targeted message through email, push, SMS, and more, 
              ensuring timely communication with your audience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
              Take a tour
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium"
              >
                Create campaign <ChevronDown className="w-4 h-4" />
              </button>
              {showCreateMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {Object.entries(CAMPAIGN_TYPES).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Link
                        key={type}
                        href={`/marketing/campaigns/new?type=${type}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        onClick={() => setShowCreateMenu(false)}
                      >
                        <div className="p-2 rounded-lg" style={{ backgroundColor: config.color + "20" }}>
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <span className="text-white">{config.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value !== "all") addFilter(`Status: ${e.target.value}`);
            }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Tag</label>
          <select 
            value={tagFilter} 
            onChange={(e) => {
              setTagFilter(e.target.value);
              if (e.target.value) addFilter(`Tag: ${e.target.value}`);
            }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Select...</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5"
        >
          <Filter className="w-4 h-4" /> Filters
        </button>

        <button className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
          <Columns className="w-4 h-4" /> Columns
        </button>

        <button 
          onClick={() => { setStatusFilter("all"); setTagFilter(""); setActiveFilters([]); }}
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          Reset filters
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {activeFilters.map(filter => (
            <span key={filter} className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
              {filter}
              <button onClick={() => removeFilter(filter)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <span className="text-white font-medium">{filteredCampaigns.length} Results</span>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-sm font-medium text-gray-400">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Stop date</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Campaign type</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Entry schedule</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Sent</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((campaign, i) => {
              const typeConfig = CAMPAIGN_TYPES[campaign.type];
              const Icon = typeConfig?.icon || Mail;
              return (
                <motion.tr 
                  key={campaign.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="p-4">
                    <Link href={`/marketing/campaigns/${campaign.id}`} className="text-white hover:text-purple-400 font-medium">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{campaign.stopDate || "-"}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium w-fit" 
                      style={{ backgroundColor: typeConfig?.color + "20", color: typeConfig?.color }}>
                      <Icon className="w-3 h-3" />
                      {typeConfig?.label}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm capitalize">{campaign.schedule.replace("-", " ")}</td>
                  <td className="p-4 text-white">{campaign.sent.toLocaleString()}</td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
