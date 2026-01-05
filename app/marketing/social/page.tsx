"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Share2, Calendar, MessageSquare, Heart, Repeat2, Eye, Users,
  TrendingUp, Clock, Image, Video, Link2, Send, Plus, Filter,
  BarChart3, Bell, Inbox, Settings, ChevronLeft, ChevronRight,
  Twitter, Instagram, Linkedin, Facebook, Youtube, Loader2
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PLATFORMS = [
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "#1DA1F2", followers: 45200, engagement: 4.2 },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", followers: 128500, engagement: 6.8 },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", followers: 23400, engagement: 3.5 },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", followers: 89000, engagement: 2.1 },
];

const SCHEDULED_POSTS = [
  { id: "p1", platform: "twitter", content: "🚀 Exciting news coming tomorrow! Stay tuned for our biggest announcement yet. #Innovation", time: "Today, 2:00 PM", status: "scheduled", engagement: null },
  { id: "p2", platform: "instagram", content: "Behind the scenes of our latest photoshoot 📸 Swipe to see the magic!", time: "Today, 5:00 PM", status: "scheduled", engagement: null },
  { id: "p3", platform: "linkedin", content: "We're hiring! Join our growing team and make an impact. Link in bio.", time: "Tomorrow, 9:00 AM", status: "scheduled", engagement: null },
  { id: "p4", platform: "twitter", content: "Thank you for 50K followers! 🎉 Here's a special discount code: THANKS50", time: "Yesterday, 3:00 PM", status: "published", engagement: { likes: 1245, retweets: 342, replies: 89 } },
  { id: "p5", platform: "instagram", content: "New product drop! Limited edition collection available now ✨", time: "2 days ago", status: "published", engagement: { likes: 8934, comments: 456, saves: 1203 } },
];

const CALENDAR_DAYS = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.getDate(),
    posts: Math.floor(Math.random() * 4),
  };
});

const INBOX_MESSAGES = [
  { id: "m1", platform: "twitter", user: "@john_doe", message: "Love your products! When's the next sale?", time: "5 min ago", unread: true },
  { id: "m2", platform: "instagram", user: "sarah.marketing", message: "Can we collaborate? DM me!", time: "15 min ago", unread: true },
  { id: "m3", platform: "facebook", user: "Tech Reviews", message: "Would love to feature your product", time: "1 hour ago", unread: false },
  { id: "m4", platform: "linkedin", user: "HR Manager at TechCo", message: "Interested in partnership opportunities", time: "3 hours ago", unread: false },
];

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState<"scheduler" | "inbox" | "analytics">("scheduler");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [newPost, setNewPost] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const totalFollowers = PLATFORMS.reduce((acc, p) => acc + p.followers, 0);
  const avgEngagement = (PLATFORMS.reduce((acc, p) => acc + p.engagement, 0) / PLATFORMS.length).toFixed(1);
  const unreadMessages = INBOX_MESSAGES.filter(m => m.unread).length;

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform ? platform.icon : Share2;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform?.color || "#666";
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Social Media" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30">
            <Share2 className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Social Media Manager</h1>
            <p className="text-gray-400">Gestiona todas tus redes sociales en un solo lugar</p>
          </div>
        </div>
        <button onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 rounded-xl text-white font-medium">
          <Plus className="w-5 h-5" /> Create Post
        </button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {PLATFORMS.map(p => {
          const Icon = p.icon;
          return (
            <GlassCard key={p.id} className="p-4 cursor-pointer hover:border-white/20 transition-all"
              onClick={() => setSelectedPlatform(selectedPlatform === p.id ? "all" : p.id)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: p.color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <span className="text-white font-medium">{p.name}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xl font-bold text-white">{(p.followers / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-400">{p.engagement}%</div>
                  <div className="text-xs text-gray-500">Engagement</div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={(totalFollowers / 1000).toFixed(0) + "K"} label="Total Followers" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={avgEngagement + "%"} label="Avg Engagement" icon={<TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={SCHEDULED_POSTS.filter(p => p.status === "scheduled").length.toString()} label="Scheduled Posts" icon={<Calendar className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={unreadMessages.toString()} label="Unread Messages" icon={<Inbox className="w-6 h-6 text-pink-400" />} color="#ec4899" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "scheduler", label: "Scheduler", icon: Calendar },
          { id: "inbox", label: "Inbox", icon: Inbox, badge: unreadMessages },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="px-2 py-0.5 bg-pink-500 rounded-full text-xs text-white">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Scheduler Tab */}
      {activeTab === "scheduler" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Calendar Mini */}
          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {CALENDAR_DAYS.map((d, i) => (
                <div key={i} className={`text-center p-2 rounded-lg ${i === 0 ? "bg-purple-500/20 border border-purple-500" : "bg-white/5"}`}>
                  <div className="text-xs text-gray-400">{d.day}</div>
                  <div className="text-lg font-bold text-white">{d.date}</div>
                  {d.posts > 0 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: Math.min(d.posts, 3) }).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Posts List */}
          <div className="col-span-2">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Scheduled & Recent Posts</h3>
                <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                  <option value="all">All Platforms</option>
                  {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {SCHEDULED_POSTS.filter(p => selectedPlatform === "all" || p.platform === selectedPlatform).map(post => {
                  const PlatformIcon = getPlatformIcon(post.platform);
                  return (
                    <div key={post.id} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: getPlatformColor(post.platform) + "20" }}>
                          <PlatformIcon className="w-4 h-4" style={{ color: getPlatformColor(post.platform) }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm mb-2">{post.content}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {post.time}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              post.status === "scheduled" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                            }`}>{post.status}</span>
                          </div>
                          {post.engagement && (
                            <div className="flex gap-4 mt-2">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Heart className="w-3 h-3" /> {post.engagement.likes || post.engagement.likes}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {post.engagement.retweets || post.engagement.comments}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Inbox Tab */}
      {activeTab === "inbox" && (
        <GlassCard className="p-5">
          <h3 className="text-lg font-bold text-white mb-4">Social Inbox</h3>
          <div className="space-y-3">
            {INBOX_MESSAGES.map(msg => {
              const PlatformIcon = getPlatformIcon(msg.platform);
              return (
                <div key={msg.id} className={`p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                  msg.unread ? "bg-purple-500/10 border border-purple-500/30" : "bg-white/5 hover:bg-white/10"
                }`}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: getPlatformColor(msg.platform) + "20" }}>
                    <PlatformIcon className="w-4 h-4" style={{ color: getPlatformColor(msg.platform) }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{msg.user}</span>
                      {msg.unread && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <p className="text-sm text-gray-400">{msg.message}</p>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">Reply</button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Engagement by Platform</h3>
            <div className="space-y-4">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: p.color }} />
                        <span className="text-sm text-white">{p.name}</span>
                      </div>
                      <span className="text-sm text-white font-medium">{p.engagement}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${p.engagement * 10}%` }}
                        className="h-full rounded-full" style={{ backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Best Posting Times</h3>
            <div className="space-y-3">
              {[
                { day: "Monday", time: "9:00 AM", engagement: "High" },
                { day: "Wednesday", time: "12:00 PM", engagement: "Very High" },
                { day: "Friday", time: "3:00 PM", engagement: "High" },
                { day: "Saturday", time: "10:00 AM", engagement: "Medium" },
              ].map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{slot.day}</div>
                    <div className="text-sm text-gray-400">{slot.time}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    slot.engagement === "Very High" ? "bg-green-500/20 text-green-400" :
                    slot.engagement === "High" ? "bg-blue-500/20 text-blue-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{slot.engagement}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Composer Modal */}
      {showComposer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowComposer(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Create Post</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} className="p-2 rounded-lg border border-white/10 hover:border-white/30" style={{ backgroundColor: p.color + "10" }}>
                      <Icon className="w-5 h-5" style={{ color: p.color }} />
                    </button>
                  );
                })}
              </div>
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} rows={4}
                placeholder="What's on your mind?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none mb-4" />
              <div className="flex gap-2 mb-4">
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Image className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Video className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Link2 className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowComposer(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">Cancel</button>
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg text-white flex items-center gap-2">
                  <Send className="w-4 h-4" /> Post Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
