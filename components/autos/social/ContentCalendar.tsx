"use client";

import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Facebook, Instagram, Music2, Youtube } from "lucide-react";
import type { ScheduledPost, SocialPlatform } from "@/types/social-ai";

const PLATFORM_ICONS: Record<SocialPlatform, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
};

const STATUS_META = {
  scheduled: { Icon: Clock, color: "text-blue-400", label: "Programado" },
  published: { Icon: CheckCircle, color: "text-emerald-400", label: "Publicado" },
  failed: { Icon: XCircle, color: "text-red-400", label: "Fallido" },
  draft: { Icon: AlertCircle, color: "text-gray-400", label: "Borrador" },
  cancelled: { Icon: XCircle, color: "text-gray-500", label: "Cancelado" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface Props {
  posts: ScheduledPost[];
  loading?: boolean;
}

export default function ContentCalendar({ posts, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6">
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Calendario de Contenido</h2>
        <span className="ml-auto text-xs text-gray-400">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay posts programados. Crea uno con el generador de contenido.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const statusMeta = STATUS_META[post.status] ?? STATUS_META.draft;
            return (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4"
              >
                {/* Platforms */}
                <div className="flex gap-1 mt-0.5">
                  {post.platforms.map((p) => {
                    const Icon = PLATFORM_ICONS[p];
                    return Icon ? <Icon key={p} className="w-4 h-4 text-gray-400" /> : null;
                  })}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{post.ai_copy}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <statusMeta.Icon className={`w-3 h-3 ${statusMeta.color}`} />
                    <span className={`text-xs ${statusMeta.color}`}>{statusMeta.label}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(post.scheduled_at)}</span>
                    {post.is_mock && (
                      <span className="text-xs text-amber-500/70">DEMO</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
