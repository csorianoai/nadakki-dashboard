"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, Sparkles, X } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ThemeId, THEME_ORDER } from "@/config/themes";

const THEME_ICONS: Record<ThemeId, string> = {
  graphite: "⚫",
  quantum: "🌌",
  navy: "🌊",
  gradient: "🎨",
  olive: "🌿",
};

export default function ThemeSwitcher() {
  const { theme, themeId, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
        style={{ 
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.borderPrimary}`
        }}
        title="Cambiar tema"
      >
        <Palette className="w-4 h-4" style={{ color: theme.colors.accentPrimary }} />
        <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{theme.name}</span>
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accentPrimary }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accentSecondary }} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-80 p-3 rounded-xl shadow-2xl z-50"
              style={{ 
                backgroundColor: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.borderPrimary}`
              }}
            >
              <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: `1px solid ${theme.colors.borderPrimary}` }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
                  <Sparkles className="w-4 h-4" style={{ color: theme.colors.accentPrimary }} />
                  Seleccionar Tema
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:opacity-70">
                  <X className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
                </button>
              </div>

              <div className="space-y-1">
                {THEME_ORDER.map((id) => {
                  const t = themes[id];
                  return (
                    <button
                      key={id}
                      onClick={() => { setTheme(id); setIsOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                      style={{
                        backgroundColor: themeId === id ? `${t.colors.accentPrimary}20` : "transparent",
                        border: themeId === id ? `1px solid ${t.colors.accentPrimary}50` : "1px solid transparent"
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-inner"
                        style={{ backgroundColor: t.preview, border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        {THEME_ICONS[id]}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                            {t.name}
                          </span>
                          {t.category === "premium" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">PRO</span>
                          )}
                          {t.category === "exclusive" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">VIP</span>
                          )}
                          {themeId === id && <Check className="w-4 h-4" style={{ color: theme.colors.success }} />}
                        </div>
                        <p className="text-xs line-clamp-1" style={{ color: theme.colors.textMuted }}>
                          {t.description}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.accentPrimary }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.accentSecondary }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 text-center" style={{ borderTop: `1px solid ${theme.colors.borderPrimary}` }}>
                <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                  El tema se guarda automáticamente
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
