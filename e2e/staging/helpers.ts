/**
 * Staging E2E helpers — credentials from CI secrets, never logged.
 */
import type { APIRequestContext } from "@playwright/test";

export const STAGING_API =
  process.env.STAGING_E2E_BASE_URL ?? "https://nadakki-ai-suite-staging.onrender.com";
export const STAGING_FRONTEND =
  process.env.STAGING_E2E_FRONTEND_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "https://autos.nadakki.com";
export const TENANT_SLUG = process.env.STAGING_E2E_TENANT_SLUG ?? "nadakki-e2e-staging";

export function requireStagingPassword(): string {
  const pwd = process.env.STAGING_E2E_PASSWORD?.trim();
  if (!pwd) {
    throw new Error("STAGING_E2E_PASSWORD required for staging E2E");
  }
  return pwd;
}

export async function loginApi(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const resp = await request.post(`${STAGING_API}/api/v2/auth/login`, {
    data: {
      email,
      password: requireStagingPassword(),
      tenant_slug: TENANT_SLUG,
    },
  });
  if (!resp.ok()) {
    throw new Error(`Login failed ${email}: ${resp.status()}`);
  }
  const body = await resp.json();
  return body.access_token as string;
}

export const STAGING_USERS = {
  admin: process.env.STAGING_E2E_ADMIN_EMAIL ?? "e2e.admin@nadakki-e2e-staging.com",
  dealer: process.env.STAGING_E2E_DEALER_EMAIL ?? "e2e.dealer@nadakki-e2e-staging.com",
  bank: process.env.STAGING_E2E_BANK_EMAIL ?? "e2e.bank@nadakki-e2e-staging.com",
  marketing: process.env.STAGING_E2E_MARKETING_EMAIL ?? "e2e.marketing@nadakki-e2e-staging.com",
  legal: process.env.STAGING_E2E_LEGAL_EMAIL ?? "e2e.legal@nadakki-e2e-staging.com",
} as const;
