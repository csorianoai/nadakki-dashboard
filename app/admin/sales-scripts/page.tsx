"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { postOfferStrategyGenerate, suiteFailure } from "@/lib/api/suiteOps";

const SEGMENTS = [
  "general",
  "birthday_groups",
  "couples",
  "tourists",
  "party_groups",
  "working_professionals",
  "small_business_owners",
  "local_diners",
];

export default function AdminSalesScriptsPage() {
  const { tenantId } = useTenant();
  const [segment, setSegment] = useState("couples");
  const [product, setProduct] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [context, setContext] = useState("");
  const [manualTenant, setManualTenant] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const tid = (tenantId || manualTenant).trim();

  const run = async () => {
    setError(null);
    setData(null);
    if (!tid) {
      setError("Set tenant in context or enter a tenant id.");
      return;
    }
    setLoading(true);
    const r = await postOfferStrategyGenerate({
      tenant_id: tid,
      segment,
      product: product.trim() || undefined,
      base_price: basePrice.trim() || undefined,
      context: context.trim() || undefined,
    });
    setLoading(false);
    const fail = suiteFailure(r);
    if (fail) {
      setError(fail.error);
      return;
    }
    if (r.ok) setData(r.data);
  };

  const strategy = (data?.offer_strategy as Record<string, unknown> | undefined) ?? undefined;
  const meta = (data?.metadata as Record<string, unknown> | undefined) ?? undefined;
  const scriptLines =
    (strategy?.sales_script_lines as string[] | undefined) ??
    (strategy?.scripts as string[] | undefined) ??
    (strategy?.message_lines as string[] | undefined) ??
    [];

  const copyText = async (label: string, value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied((current) => (current === label ? null : current)), 1200);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Offer & sales scripts</h1>
        <p className="text-gray-400 mt-1 max-w-2xl">
          Uses <code className="text-gray-500">POST /api/v1/offers/strategy/generate</code> (OfferStrategyIA). Output feeds
          messaging and script-style copy; grounded in tenant profile when present.
        </p>
      </motion.div>

      <GlassCard className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!tenantId && (
            <label className="block md:col-span-2">
              <span className="text-xs text-gray-500">Tenant ID (required if no context tenant)</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
                value={manualTenant}
                onChange={(e) => setManualTenant(e.target.value)}
              />
            </label>
          )}
          {tenantId && (
            <p className="text-sm text-gray-400 md:col-span-2">
              Context tenant: <span className="text-white font-mono">{tenantId}</span>
            </p>
          )}
          <label className="block">
            <span className="text-xs text-gray-500">Segment</span>
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            >
              {SEGMENTS.map((s) => (
                <option key={s} value={s} className="bg-[#0d1117]">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Product hint</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Matches catalog id or name"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Base price (optional)</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="$199 or 199"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500">Context (optional)</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="weekend availability, seasonal, …"
            />
          </label>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating strategy…" : "Generate strategy"}
          </button>
        </div>
      </GlassCard>

      {!data && !loading && !error && (
        <GlassCard className="p-6 mb-6 border border-white/10">
          <p className="text-sm text-gray-300 m-0">
            No strategy generated yet. Run once to see offer framing, CTA, urgency angle, and reusable script lines for sales
            conversations.
          </p>
        </GlassCard>
      )}

      {strategy && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["Core offer", strategy.core_offer],
              ["Price framing", strategy.price_framing],
              ["CTA", strategy.cta],
              ["Urgency", strategy.urgency_angle],
              ["Segment fit", strategy.segment_fit_reason],
            ] as const
          ).map(([title, val]) => (
            <GlassCard key={title} className="p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 m-0">{title}</h3>
                <button
                  type="button"
                  onClick={() => void copyText(title, val)}
                  className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1"
                >
                  {copied === title ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === title ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap m-0">{String(val ?? "")}</p>
            </GlassCard>
          ))}
          <GlassCard className="p-5 md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Value stack</h3>
            {Array.isArray(strategy.value_stack) && strategy.value_stack.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 m-0">
                {(strategy.value_stack as string[]).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 m-0">No value stack returned for this request.</p>
            )}
          </GlassCard>
          <GlassCard className="p-5 md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Sales script lines</h3>
            {scriptLines.length > 0 ? (
              <ol className="list-decimal list-inside text-sm text-gray-200 space-y-1 m-0">
                {scriptLines.map((line, i) => (
                  <li key={`${line}-${i}`} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500 m-0">No explicit script lines in backend response.</p>
            )}
          </GlassCard>
        </div>
      )}

      {meta && (
        <GlassCard className="p-4 mt-6">
          <p className="text-xs text-gray-500 m-0">
            Product matched: {String(meta.product_matched_from_catalog)} · Segment registry:{" "}
            {String(meta.segment_known)}
          </p>
        </GlassCard>
      )}

      {data && !strategy && (
        <GlassCard className="p-4 mt-4">
          <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </GlassCard>
      )}
    </div>
  );
}
