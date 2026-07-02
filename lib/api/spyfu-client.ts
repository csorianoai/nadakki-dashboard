import type {
  AdsResponse,
  AdHistoryData,
  ChatResponse,
  CompareDomainsData,
  CompetitorAnalysisData,
  CompetitorsResponse,
  DomainSnapshotData,
  DomainStatsResponse,
  IntelligenceEnvelope,
  KeywordIntelData,
  KeywordsResponse,
  TenantConfigResponse,
  TermAdHistoryResponse,
  UsageResponse,
} from "@/types/spyfu";
import {
  BudgetExceededError,
  MissingTenantError,
  NetworkError,
  TenantMismatchError,
  UnknownIntentError,
  FeatureDisabledError as FeatureDisabledErrorClass,
} from "@/types/spyfu";

const DEFAULT_BASE = "https://nadakki-ai-suite.onrender.com";


function getDetail(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  return (body as Record<string, unknown>).detail;
}

export class SpyFuClient {
  private baseUrl: string;
  private tenantId: string;

  constructor() {
    this.baseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE).replace(/\/$/, "");
    this.tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim() || "";
  }

  private resolveTenant(override?: string | null): string {
    const t = (override ?? "").trim() || this.tenantId;
    if (!t) throw new MissingTenantError();
    return t;
  }

  private async throwForStatus(res: Response, body: unknown): Promise<never> {
    const detail = getDetail(body);

    if (res.status === 400) {
      const msg = typeof detail === "string" ? detail : "Bad request";
      throw new MissingTenantError(msg);
    }
    if (res.status === 403) {
      throw new TenantMismatchError(typeof detail === "string" ? detail : "tenant_mismatch");
    }
    if (res.status === 422) {
      const d = detail as Record<string, unknown> | string | undefined;
      if (d && typeof d === "object" && d.error === "unknown_intent") {
        const ex = (d.examples as Record<string, string[]>) || {};
        throw new UnknownIntentError("unknown_intent", { es: ex.es, en: ex.en });
      }
      throw new UnknownIntentError("unknown_intent", {});
    }
    if (res.status === 429) {
      const d = (detail || {}) as Record<string, unknown>;
      throw new BudgetExceededError(
        typeof d.error === "string" ? d.error : "spyfu_budget_exceeded",
        {
          rows_used: typeof d.rows_used === "number" ? d.rows_used : undefined,
          rows_cap: typeof d.rows_cap === "number" ? d.rows_cap : undefined,
          endpoint: typeof d.endpoint === "string" ? d.endpoint : undefined,
        }
      );
    }
    if (res.status === 503) {
      const d = (detail || {}) as Record<string, unknown>;
      throw new FeatureDisabledErrorClass(
        typeof d.error === "string" ? d.error : "feature_disabled"
      );
    }

    const msg =
      typeof detail === "string"
        ? detail
        : res.statusText || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  private async request<T>(
    path: string,
    init: RequestInit & { tenantId?: string | null } = {}
  ): Promise<T> {
    const { tenantId: tenantOverride, ...reqInit } = init;
    const tenant = this.resolveTenant(tenantOverride ?? undefined);
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    let res: Response;
    try {
      res = await fetch(url, {
        ...reqInit,
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenant,
          ...(reqInit.headers as Record<string, string>),
        },
      });
    } catch (e) {
      throw new NetworkError("Network request failed. Check connection and API URL.", {
        cause: e,
      });
    }

    let body: unknown = null;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    if (!res.ok) {
      await this.throwForStatus(res, body);
    }

    return body as T;
  }

  async getAds(domain: string, countryCode = "US", tenantId?: string | null): Promise<AdsResponse> {
    const q = new URLSearchParams({ country_code: countryCode });
    return this.request<AdsResponse>(
      `/api/v1/spyfu/ads/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getKeywords(
    domain: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<KeywordsResponse> {
    const q = new URLSearchParams({ country_code: countryCode });
    return this.request<KeywordsResponse>(
      `/api/v1/spyfu/keywords/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getCompetitors(
    domain: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<CompetitorsResponse> {
    const q = new URLSearchParams({ country_code: countryCode });
    return this.request<CompetitorsResponse>(
      `/api/v1/spyfu/competitors/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getSeoCompetitors(
    domain: string,
    countryCode = "US",
    pageSize = 10,
    tenantId?: string | null
  ): Promise<CompetitorsResponse> {
    const q = new URLSearchParams({
      country_code: countryCode,
      page_size: String(pageSize),
    });
    return this.request<CompetitorsResponse>(
      `/api/v1/spyfu/seo-competitors/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getPaidSerps(
    domain: string,
    countryCode = "US",
    pageSize = 20,
    tenantId?: string | null
  ): Promise<unknown> {
    const q = new URLSearchParams({
      country_code: countryCode,
      page_size: String(pageSize),
    });
    return this.request(`/api/v1/spyfu/paid-serps/${encodeURIComponent(domain)}?${q}`, {
      method: "GET",
      tenantId,
    });
  }

  async getTermAdHistory(
    keyword: string,
    countryCode = "US",
    pageSize = 10,
    tenantId?: string | null
  ): Promise<TermAdHistoryResponse> {
    const q = new URLSearchParams({
      country_code: countryCode,
      page_size: String(pageSize),
    });
    return this.request<TermAdHistoryResponse>(
      `/api/v1/spyfu/term-ad-history/${encodeURIComponent(keyword)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getDomainStatsHistorical(
    domain: string,
    year: number,
    month: number,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<unknown> {
    const q = new URLSearchParams({
      year: String(year),
      month: String(month),
      country_code: countryCode,
    });
    return this.request(
      `/api/v1/spyfu/domain-stats-historical/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getDomainStatsAll(
    domain: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<DomainStatsResponse> {
    const q = new URLSearchParams({ country_code: countryCode });
    return this.request<DomainStatsResponse>(
      `/api/v1/spyfu/domain-stats-all/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getUsage(tenantId?: string | null): Promise<UsageResponse> {
    const tid = this.resolveTenant(tenantId ?? undefined);
    return this.request<UsageResponse>(`/api/v1/spyfu/usage/${encodeURIComponent(tid)}`, {
      method: "GET",
      tenantId: tid,
    });
  }

  async getTenantConfig(tenantId?: string | null): Promise<TenantConfigResponse> {
    const tid = this.resolveTenant(tenantId ?? undefined);
    return this.request<TenantConfigResponse>(
      `/api/v1/spyfu/tenant-config/${encodeURIComponent(tid)}`,
      { method: "GET", tenantId: tid }
    );
  }

  async analyzeCompetitor(
    domain: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<IntelligenceEnvelope<CompetitorAnalysisData>> {
    const tid = this.resolveTenant(tenantId ?? undefined);
    return this.request<IntelligenceEnvelope<CompetitorAnalysisData>>(
      `/api/v1/spyfu/intelligence/competitor-analysis`,
      {
        method: "POST",
        tenantId: tid,
        body: JSON.stringify({
          tenant_id: tid,
          competitor_domain: domain,
          country_code: countryCode,
        }),
      }
    );
  }

  async getIntelligenceAdHistory(
    domain: string,
    opts?: { pageSize?: number; keywordFilter?: string; countryCode?: string; tenantId?: string | null }
  ): Promise<IntelligenceEnvelope<AdHistoryData>> {
    const country = opts?.countryCode ?? "US";
    const pageSize = opts?.pageSize ?? 50;
    const kw = opts?.keywordFilter ?? "";
    const q = new URLSearchParams({
      page_size: String(pageSize),
      country_code: country,
      keyword_filter: kw,
    });
    return this.request<IntelligenceEnvelope<AdHistoryData>>(
      `/api/v1/spyfu/intelligence/ad-history/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId: opts?.tenantId }
    );
  }

  async compareDomains(
    domainA: string,
    domainB: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<IntelligenceEnvelope<CompareDomainsData>> {
    const tid = this.resolveTenant(tenantId ?? undefined);
    return this.request<IntelligenceEnvelope<CompareDomainsData>>(
      `/api/v1/spyfu/intelligence/compare-domains`,
      {
        method: "POST",
        tenantId: tid,
        body: JSON.stringify({
          tenant_id: tid,
          domain_a: domainA,
          domain_b: domainB,
          country_code: countryCode,
        }),
      }
    );
  }

  async getKeywordIntelligence(
    keyword: string,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<IntelligenceEnvelope<KeywordIntelData>> {
    const q = new URLSearchParams({ country_code: countryCode });
    return this.request<IntelligenceEnvelope<KeywordIntelData>>(
      `/api/v1/spyfu/intelligence/keyword/${encodeURIComponent(keyword)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async getDomainSnapshot(
    domain: string,
    pastNMonths = 6,
    countryCode = "US",
    tenantId?: string | null
  ): Promise<IntelligenceEnvelope<DomainSnapshotData>> {
    const q = new URLSearchParams({
      past_n_months: String(pastNMonths),
      country_code: countryCode,
    });
    return this.request<IntelligenceEnvelope<DomainSnapshotData>>(
      `/api/v1/spyfu/intelligence/domain-snapshot/${encodeURIComponent(domain)}?${q}`,
      { method: "GET", tenantId }
    );
  }

  async chat(
    message: string,
    opts?: {
      language?: "es" | "en" | "auto";
      countryCode?: string;
      conversationId?: string;
      tenantId?: string | null;
    }
  ): Promise<ChatResponse> {
    const tid = this.resolveTenant(opts?.tenantId ?? undefined);
    return this.request<ChatResponse>(`/api/v1/spyfu/chat`, {
      method: "POST",
      tenantId: tid,
      body: JSON.stringify({
        message,
        tenant_id: tid,
        language: opts?.language ?? "auto",
        country_code: opts?.countryCode ?? "US",
        conversation_id: opts?.conversationId,
      }),
    });
  }
}

export const spyfu = new SpyFuClient();
