"use client";

import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import SocialAccountsConnect from "@/components/autos/social/SocialAccountsConnect";
import ContentCalendar from "@/components/autos/social/ContentCalendar";
import AIContentGenerator from "@/components/autos/social/AIContentGenerator";
import {
  listSocialAccounts,
  connectPlatform,
  listScheduledPosts,
  generateSocialContent,
} from "@/lib/autos-portal/social-api";
import type { SocialAccount, ScheduledPost, SocialPlatform } from "@/types/social-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

export default function RedesSocialesPage() {
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;
  const did = DEMO_DEALER_ID;

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isMock, setIsMock] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    listSocialAccounts(did, tid)
      .then((r) => {
        setAccounts(r.accounts);
        setIsMock(r.is_mock);
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));

    listScheduledPosts(did, tid)
      .then((r) => {
        setPosts(r.posts);
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [tid, did]);

  async function handleConnect(platform: SocialPlatform) {
    const result = await connectPlatform(platform, did, tid);
    // Refresh accounts
    const updated = await listSocialAccounts(did, tid);
    setAccounts(updated.accounts);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Redes Sociales AI</h1>
            <p className="text-sm text-gray-400">Gestión inteligente de contenido social</p>
          </div>
        </div>
        {isMock && (
          <span className="text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            MODO DEMO
          </span>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {loadingAccounts ? (
            <div className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ) : (
            <SocialAccountsConnect
              accounts={accounts}
              isMock={isMock}
              onConnect={handleConnect}
            />
          )}

          <AIContentGenerator
            isMock={isMock}
            onGenerate={(params) => generateSocialContent({ dealer_id: did, tenant_id: tid, ...params })}
          />
        </div>

        {/* Right column */}
        <div>
          <ContentCalendar posts={posts} loading={loadingPosts} />
        </div>
      </div>
    </div>
  );
}
