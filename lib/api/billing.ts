/**
 * Billing / Stripe checkout — same-origin `/api/v1/*` (proxied).
 *
 * Expected upstream shapes (tolerant parsing):
 * - POST .../tenants/{id}/billing/checkout → { url } | { checkout_url } | { data: { url } }
 * - GET  .../tenants/{id}/billing → plan, subscription_status, current_period_end, ...
 * - GET  .../tenants/{id}/billing/invoices → array or { invoices: [...] }
 * - GET  .../tenants/{id}/billing/invoices/{id}/pdf → JSON { url | pdf_url } (Stripe hosted PDF);
 *   binary PDF via the text-based proxy is not reliable; prefer signed URLs in JSON.
 */

export interface BillingStatus {
  plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

export interface BillingInvoice {
  id: string;
  number?: string | null;
  status?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  currency?: string | null;
  created_at?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
}

export class BillingApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "BillingApiError";
  }
}

function unwrapRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const inner = d.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return d;
}

async function readErrorBody(res: Response): Promise<unknown> {
  try {
    const t = await res.text();
    if (!t) return null;
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return t;
    }
  } catch {
    return null;
  }
}

function errMessageFromBody(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === "string") return body.slice(0, 300) || null;
  if (typeof body === "object" && "error" in body) {
    const e = (body as Record<string, unknown>).error;
    if (typeof e === "string") return e;
  }
  if (typeof body === "object" && "detail" in body) {
    const d = (body as Record<string, unknown>).detail;
    if (typeof d === "string") return d;
  }
  return null;
}

export async function getBillingStatus(
  tenantId: string,
  init?: RequestInit
): Promise<BillingStatus | null> {
  const tid = (tenantId ?? "").trim();
  if (!tid) return null;
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(tid)}/billing`,
      {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tid,
          ...(init?.headers as Record<string, string> | undefined),
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const d = unwrapRecord(json);
    if (!d) return null;

    const sub = d.subscription;
    const subRec =
      sub && typeof sub === "object" ? (sub as Record<string, unknown>) : null;

    const planRaw = d.plan ?? d.plan_id ?? d.planId ?? subRec?.plan;
    const statusRaw =
      d.subscription_status ??
      d.subscriptionStatus ??
      d.status ??
      subRec?.status;

    const endRaw =
      d.current_period_end ??
      d.currentPeriodEnd ??
      d.renewal_at ??
      d.renews_at ??
      subRec?.current_period_end;

    const cancelRaw =
      d.cancel_at_period_end ??
      d.cancelAtPeriodEnd ??
      subRec?.cancel_at_period_end;

    return {
      plan: planRaw != null && String(planRaw).length ? String(planRaw) : null,
      subscription_status:
        statusRaw != null && String(statusRaw).length
          ? String(statusRaw)
          : null,
      current_period_end:
        endRaw != null && String(endRaw).length ? String(endRaw) : null,
      cancel_at_period_end:
        typeof cancelRaw === "boolean"
          ? cancelRaw
          : cancelRaw === "true"
            ? true
            : cancelRaw === "false"
              ? false
              : null,
    };
  } catch {
    return null;
  }
}

export async function getInvoices(
  tenantId: string,
  init?: RequestInit
): Promise<BillingInvoice[]> {
  const tid = (tenantId ?? "").trim();
  if (!tid) return [];
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(tid)}/billing/invoices`,
      {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tid,
          ...(init?.headers as Record<string, string> | undefined),
        },
      }
    );
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const d = unwrapRecord(json);
    const root = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
    const list =
      (d && Array.isArray(d.invoices) && d.invoices) ||
      (root && Array.isArray(root.data) && root.data) ||
      (Array.isArray(json) ? json : null);
    if (!Array.isArray(list)) return [];

    return list
      .map((row: unknown): BillingInvoice | null => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const id = r.id ?? r.invoice_id;
        if (id == null) return null;
        const cur = r.currency != null ? String(r.currency) : "usd";
        return {
          id: String(id),
          number: r.number != null ? String(r.number) : null,
          status: r.status != null ? String(r.status) : null,
          amount_due:
            r.amount_due != null
              ? Number(r.amount_due)
              : r.amountDue != null
                ? Number(r.amountDue)
                : null,
          amount_paid:
            r.amount_paid != null
              ? Number(r.amount_paid)
              : r.amountPaid != null
                ? Number(r.amountPaid)
                : null,
          currency: cur,
          created_at:
            r.created_at != null
              ? String(r.created_at)
              : r.created != null
                ? String(r.created)
                : null,
          hosted_invoice_url:
            r.hosted_invoice_url != null
              ? String(r.hosted_invoice_url)
              : r.hostedInvoiceUrl != null
                ? String(r.hostedInvoiceUrl)
                : null,
          invoice_pdf:
            r.invoice_pdf != null
              ? String(r.invoice_pdf)
              : r.invoicePdf != null
                ? String(r.invoicePdf)
                : null,
        };
      })
      .filter((x): x is BillingInvoice => x != null);
  } catch {
    return [];
  }
}

/**
 * Creates a Stripe Checkout Session server-side; returns the hosted Checkout URL.
 */
export async function createCheckout(
  plan: string,
  tenantId: string,
  init?: RequestInit
): Promise<{ url: string }> {
  const tid = (tenantId ?? "").trim();
  if (!tid) {
    throw new BillingApiError("Se requiere un tenant seleccionado.", 400);
  }
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const payload = {
    plan,
    success_url: origin ? `${origin}/billing?checkout=success` : undefined,
    cancel_url: origin ? `${origin}/billing?checkout=cancel` : undefined,
  };

  const res = await fetch(
    `/api/v1/tenants/${encodeURIComponent(tid)}/billing/checkout`,
    {
      ...init,
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tid,
        ...(init?.headers as Record<string, string> | undefined),
      },
      body: JSON.stringify(payload),
    }
  );

  const body = await readErrorBody(res);
  if (!res.ok) {
    const hint = errMessageFromBody(body);
    throw new BillingApiError(
      hint ?? `No se pudo iniciar el checkout (HTTP ${res.status}).`,
      res.status,
      body
    );
  }

  const d = unwrapRecord(body);
  const url =
    (d?.url as string | undefined) ??
    (d?.checkout_url as string | undefined) ??
    (body &&
    typeof body === "object" &&
    "url" in body &&
    typeof (body as Record<string, unknown>).url === "string"
      ? String((body as Record<string, unknown>).url)
      : undefined);

  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    throw new BillingApiError(
      "El servidor no devolvió una URL de Stripe válida.",
      res.status,
      body
    );
  }
  return { url };
}

/**
 * Opens invoice PDF: prefers API JSON with url, else falls back to row fields on the client.
 */
export async function downloadInvoicePdf(
  id: string,
  tenantId: string,
  init?: RequestInit
): Promise<void> {
  const tid = (tenantId ?? "").trim();
  const invId = (id ?? "").trim();
  if (!tid || !invId) {
    throw new BillingApiError("Faltan tenant o factura.", 400);
  }

  const res = await fetch(
    `/api/v1/tenants/${encodeURIComponent(tid)}/billing/invoices/${encodeURIComponent(invId)}/pdf`,
    {
      ...init,
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Tenant-ID": tid,
        ...(init?.headers as Record<string, string> | undefined),
      },
    }
  );

  const body = await readErrorBody(res);

  if (res.ok && body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    const d = unwrapRecord(body) ?? rec;
    const url =
      (typeof d.url === "string" && d.url) ||
      (typeof d.pdf_url === "string" && d.pdf_url) ||
      (typeof rec.url === "string" && rec.url);
    if (url && url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
  }

  if (!res.ok) {
    const hint = errMessageFromBody(body);
    throw new BillingApiError(
      hint ?? `No se pudo obtener el PDF (HTTP ${res.status}).`,
      res.status,
      body
    );
  }

  throw new BillingApiError(
    "Respuesta sin enlace de descarga; verifica el contrato del API.",
    res.status,
    body
  );
}
