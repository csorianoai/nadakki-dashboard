"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Plus, ChevronLeft, ChevronRight,
  Instagram, Twitter, Linkedin, Mail
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const SCHEDULED_POSTS = [
  { day: 8, platform: "instagram", title: "Post de producto" },
  { day: 10, platform: "twitter", title: "Thread educativo" },
  { day: 12, platform: "linkedin", title: "Caso de éxito" },
  { day: 15, platform: "email", title: "Newsletter semanal" },
  { day: 18, platform: "instagram", title: "Reels promocional" },
  { day: 22, platform: "twitter", title: "Anuncio nuevo feature" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  email: "#22c55e",
};

export default function ContentCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing/content">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Programar Post
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Calendario Editorial</h1>
            <p className="text-gray-400">Planifica y programa tu contenido</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-white">{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const posts = SCHEDULED_POSTS.filter(p => p.day === day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth();
            
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square p-2 rounded-xl cursor-pointer transition-colors ${
                  isToday ? "bg-purple-500/20 border border-purple-500/50" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`text-sm font-medium ${isToday ? "text-purple-400" : "text-gray-400"}`}>{day}</div>
                <div className="mt-1 space-y-1">
                  {posts.map((post, j) => (
                    <div key={j} className="w-full h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[post.platform] }} title={post.title} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/10">
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400 capitalize">{platform}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
