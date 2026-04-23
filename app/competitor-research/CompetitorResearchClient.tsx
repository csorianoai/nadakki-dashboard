"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useTenant } from "@/contexts/TenantContext";
import { useSpyFuUsage } from "@/hooks/useSpyFuUsage";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import { AskAnythingTab } from "./components/AskAnythingTab";
import { DeepAnalysisTab } from "./components/DeepAnalysisTab";
import { QuickSearchTab } from "./components/QuickSearchTab";
import { TabErrorBoundary } from "./components/TabErrorBoundary";
import { UsageWidget } from "./components/UsageWidget";
import clsx from "clsx";

type TabId = "quick" | "deep" | "chat";

export default function CompetitorResearchClient() {
  const { tenantId } = useTenant();
  const { usage } = useSpyFuUsage(tenantId, 30_000);
  const [lang, setLang] = useState<UILang>("en");
  const [tab, setTab] = useState<TabId>("quick");
  const t = crStrings(lang);

  const tabs: { id: TabId; label: string }[] = [
    { id: "quick", label: t.tabQuick },
    { id: "deep", label: t.tabDeep },
    { id: "chat", label: t.tabChat },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0a0f1c] px-4 py-6 text-slate-100 md:px-8">
      <Toaster position="top-center" toastOptions={{ className: "text-sm" }} />

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">{t.pageTitle}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-slate-700/60 p-0.5">
              <button
                type="button"
                className={clsx(
                  "rounded-md px-3 py-1 text-xs font-medium",
                  lang === "en" ? "bg-cyan-600/30 text-cyan-100" : "text-slate-400"
                )}
                onClick={() => setLang("en")}
              >
                {t.langEn}
              </button>
              <button
                type="button"
                className={clsx(
                  "rounded-md px-3 py-1 text-xs font-medium",
                  lang === "es" ? "bg-cyan-600/30 text-cyan-100" : "text-slate-400"
                )}
                onClick={() => setLang("es")}
              >
                {t.langEs}
              </button>
            </div>
          </div>
        </div>
        <UsageWidget usage={usage} lang={lang} />
      </header>

      <div
        role="tablist"
        aria-label={t.pageTitle}
        className="mb-6 flex flex-wrap gap-2 border-b border-slate-800 pb-2"
      >
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            id={`cr-tab-${x.id}`}
            aria-controls={`cr-panel-${x.id}`}
            className={clsx(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === x.id
                ? "bg-slate-800 text-cyan-200"
                : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
            )}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "quick" ? (
        <div role="tabpanel" id="cr-panel-quick" aria-labelledby="cr-tab-quick">
          <TabErrorBoundary fallbackLabel={t.tabError}>
            <QuickSearchTab lang={lang} />
          </TabErrorBoundary>
        </div>
      ) : null}

      {tab === "deep" ? (
        <div role="tabpanel" id="cr-panel-deep" aria-labelledby="cr-tab-deep">
          <TabErrorBoundary fallbackLabel={t.tabError}>
            <DeepAnalysisTab lang={lang} />
          </TabErrorBoundary>
        </div>
      ) : null}

      {tab === "chat" ? (
        <div role="tabpanel" id="cr-panel-chat" aria-labelledby="cr-tab-chat">
          <TabErrorBoundary fallbackLabel={t.tabError}>
            <AskAnythingTab lang={lang} />
          </TabErrorBoundary>
        </div>
      ) : null}
    </div>
  );
}
