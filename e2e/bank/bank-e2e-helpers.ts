import { readFileSync } from "fs";
import path from "path";
import type { Page, Route } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailBody } from "../bank-application-detail-helpers";

export const FIXTURES_DIR = path.join(process.cwd(), "e2e", "fixtures", "sample-documents");

export function setupBankSession(page: Page, tenantSlug = "tenant-e2e"): void {
  const token = makeBankE2eJwt(tenantSlug);
  void page.addInitScript(
    ([k, tok, tid]: [string, string, string]) => {
      window.localStorage.setItem(k, tok);
      window.localStorage.setItem("nadakki_auth", "true");
      window.localStorage.setItem("nadakki_tenant_id", tid);
      window.localStorage.setItem("nadakki_role", "admin");
    },
    [BANK_E2E_TOKEN_KEY, token, tenantSlug],
  );
}

export async function routeBankApplicationDetail(
  page: Page,
  applicationId: string,
  body: Record<string, unknown>
): Promise<void> {
  await page.route(`**/api/v2/credit/applications/${applicationId}`, async (route: Route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function routeStipulationsAndNotify(
  page: Page,
  applicationId: string,
  items: unknown[]
): Promise<void> {
  const listPath = `/api/v2/credit/applications/${applicationId}/stipulations`;
  const stipulations = items.map((item) => ({ ...(item as Record<string, unknown>) }));

  await page.route(`**/api/v2/credit/applications/${applicationId}/stipulations**`, async (route: Route) => {
    const url = route.request().url();
    if (!url.includes(applicationId)) {
      await route.continue();
      return;
    }
    const pathname = new URL(url).pathname;
    const method = route.request().method();

    if (method === "GET" && pathname === listPath) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { stipulations } }),
      });
      return;
    }

    if (method === "POST" && pathname.includes("workflow-notify-dealer")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, notified: 2 }),
      });
      return;
    }

    if (method === "POST" && pathname.includes("/upload-link")) {
      const sid = pathname.match(/stipulations\/([^/]+)\/upload-link/)?.[1] ?? "s1";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stipulation_id: sid,
          upload_url: "https://example.invalid/upload",
          token: "tok-e2e",
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          qr_payload: "E2E",
        }),
      });
      return;
    }

    if (method === "POST" && pathname === listPath) {
      stipulations.push({ id: "stip-new", description: "E2E created", status: "pending" });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "stip-new", description: "E2E created", status: "pending" } }),
      });
      return;
    }

    if (method === "POST" && pathname.includes("/verify")) {
      const sid = pathname.match(/stipulations\/([^/]+)\/verify/)?.[1] ?? "s1";
      const row = stipulations.find((item) => item.id === sid);
      if (row) {
        row.status = "verified";
        row.verified_at = new Date().toISOString();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: "s1", description: "Ok", status: "verified" },
        }),
      });
      return;
    }

    if (method === "POST" && pathname.includes("/reject")) {
      const sid = pathname.match(/stipulations\/([^/]+)\/reject/)?.[1] ?? "s2";
      const row = stipulations.find((item) => item.id === sid);
      if (row) {
        row.status = "rejected";
        row.rejected_at = new Date().toISOString();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: "s2", description: "Ok", status: "rejected" },
        }),
      });
      return;
    }

    if (method === "POST" || method === "PATCH" || method === "PUT") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }

    if (method === "GET" && pathname.includes("/document")) {
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: readFixture("sample-cedula.pdf"),
      });
      return;
    }

    if (method === "GET" && pathname.includes("/audit")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: [{ id: "e1", at: "2026-01-01T00:00:00Z", action: "upload", detail: "402-0000000-0" }],
        }),
      });
      return;
    }

    await route.continue();
  });
}

function readFixture(name: "sample-cedula.pdf" | "sample-paystub.pdf" | "sample-bank-statement.pdf" | "sample-multi.pdf" | "sample-large.pdf"): Buffer {
  return readFileSync(path.join(FIXTURES_DIR, name));
}

export async function routeDocumentPreviewSuccess(
  page: Page,
  applicationId: string,
  documentId: string,
  pdfFile: "sample-cedula.pdf" | "sample-paystub.pdf" | "sample-bank-statement.pdf" | "sample-multi.pdf" | "sample-large.pdf"
): Promise<void> {
  const bytes = readFixture(pdfFile);
  const pages = pdfFile === "sample-multi.pdf" ? 3 : 1;

  await page.route("**/documents/*/preview.json", async (route: Route) => {
    const url = route.request().url();
    if (!url.includes(applicationId) || !url.includes(documentId)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        pages,
        page_count: pages,
        title: "E2E synthetic PDF",
        stream_path: `/api/v2/credit/applications/${applicationId}/documents/${documentId}/download`,
      }),
    });
  });

  await page.route("**/documents/*/download", async (route: Route) => {
    const url = route.request().url();
    if (!url.includes(`/documents/${documentId}/`) || !url.includes("/download")) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: bytes,
    });
  });
}

export { sampleDetailBody };
