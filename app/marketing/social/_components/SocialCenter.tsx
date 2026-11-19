"use client";

import { useCallback, useEffect, useState } from "react";
import { COPY, PLATFORM_LABEL, STATUS_LABEL, type Lang } from "@/app/marketing/social/_lib/copy";
import { DEFAULT_KIND, PLATFORMS } from "@/app/marketing/social/_lib/types";
import type { Brand, CapabilityCell, Platform, SocialAccount, SocialClient } from "@/app/marketing/social/_lib/types";
import AccountWizard from "./AccountWizard";

type Load = "loading" | "unavailable" | "ready";

const TONE: Record<string, string> = {
  CONNECTED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ACTIVE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  READY_TO_PUBLISH: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ERROR: "bg-red-500/15 text-red-300 border-red-500/30",
  REVOKED: "bg-red-500/15 text-red-300 border-red-500/30",
  NONE: "bg-white/5 text-gray-400 border-white/10",
};

export default function SocialCenter({
  client,
  demo = false,
  lang = "es",
  navigate = (url: string) => window.location.assign(url),
}: {
  client: SocialClient;
  demo?: boolean;
  lang?: Lang;
  navigate?: (url: string) => void;
}) {
  const t = COPY[lang];
  const [load, setLoad] = useState<Load>("loading");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [caps, setCaps] = useState<CapabilityCell[] | null>(null);
  const [open, setOpen] = useState<Platform | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const [b, c] = await Promise.all([client.listBrands(), client.getCapabilities()]);
      if (!live) return;
      setCaps(c.ok ? c.data : null);
      if (!b.ok) return setLoad("unavailable");
      setBrands(b.data);
      setBrandId((cur) => cur || b.data[0]?.id || "");
      if (b.data.length === 0) setLoad("ready");
    })();
    return () => {
      live = false;
    };
  }, [client]);

  const refresh = useCallback(async () => {
    if (!brandId) return;
    const r = await client.listAccounts(brandId);
    setAccounts(r.ok ? r.data : []);
    setLoad(r.ok ? "ready" : "unavailable");
  }, [client, brandId]);

  useEffect(() => {
    setOpen(null);
    void refresh();
  }, [refresh]);

  const byPlatform = (p: Platform) => accounts.find((a) => a.platform === p && a.brand_id === brandId);
  const current = brands.find((b) => b.id === brandId);
  const openAccount = open ? byPlatform(open) : undefined;

  return (
    <div className="ndk-page ndk-fade-in" data-testid="social-center">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t.title}</h1>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>
        {demo && (
          <span data-demo="true" title={t.demoNote} className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400">
            DEMO
          </span>
        )}
      </div>

      {load === "loading" && <p className="text-gray-400">{t.loading}</p>}

      {load === "unavailable" && (
        <div role="status" className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-white">{t.unavailable}</h2>
          <p className="text-gray-400">{t.unavailableHelp}</p>
        </div>
      )}

      {load === "ready" && brands.length === 0 && <p className="text-gray-400">{t.noBrands}</p>}

      {load === "ready" && brands.length > 0 && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <label htmlFor="sc-brand" className="text-sm text-gray-300">{t.brand}</label>
            <select
              id="sc-brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0a0f1c] px-3 py-2 text-white"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.display_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {PLATFORMS.map((p) => {
              const a = byPlatform(p);
              const st = a ? a.status : "NONE";
              return (
                <div key={p} data-testid={`card-${p}`} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{PLATFORM_LABEL[p]}</h3>
                    <span data-testid="status" data-status={st} className={`rounded-full border px-2 py-0.5 text-xs ${TONE[st] ?? "bg-sky-500/15 text-sky-300 border-sky-500/30"}`}>
                      {STATUS_LABEL[lang][st]}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-400">
                    {a ? a.handle || a.proposed_handle || "—" : t.noneHelp}
                  </p>
                  {a ? (
                    <button type="button" onClick={() => setOpen(open === p ? null : p)} className="mt-auto rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                      {st === "PLANNED" ? t.wizardOpen : t.wizardContinue}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const r = await client.createAccount({ brand_id: brandId, account_kind: DEFAULT_KIND[p] });
                        if (r.ok) await refresh();
                      }}
                      className="mt-auto rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                    >
                      {t.plan}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {open && openAccount && (
            <AccountWizard
              key={`${openAccount.id}-${openAccount.status}`}
              account={openAccount}
              brand={current}
              caps={caps}
              client={client}
              lang={lang}
              navigate={navigate}
              onChanged={refresh}
              onClose={() => setOpen(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
