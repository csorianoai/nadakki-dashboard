import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/contactos",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import ContactosPage from "@/app/mi-web/contactos/page";
import { resp, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const LEAD = {
  id: "n1", tenant_id: TENANT, vertical: "realestate", site_id: "00000000-0000-4000-8000-0000000000b1", idempotency_key: "synth-idem-0000002",
  name: "Visitante n1", email: "n1@synth.invalid", message: "Mensaje n1", locale: "en", source_page: "/en/properties/n1",
  consents: [{ consent_id: "d-email", channel: "email", status: "granted", text_version: "consent-email-2026-10", text_locale: "en", recorded_at: "2026-11-07T15:00:00Z" }],
  contactable_channels: ["email"], status: "projected", created_at: "2026-11-07T15:00:00Z",
  ad_click: { click_consent: "not_required", consent_region: "US", gclid: "SYNTH-NR-1" },
};

beforeEach(() => {
  f.mockReset();
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
  f.mockImplementation(async (url: string) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    if (u.endsWith("/leads/n1")) return resp(LEAD);
    if (u.endsWith("/leads")) return resp({ items: [LEAD], next_cursor: null });
    throw new Error(`url inesperada ${u}`);
  });
});
afterAll(() => { delete process.env.NEXT_PUBLIC_SITES_PANEL; });

test("click_consent=not_required con gclid: el detalle muestra el id como texto y la lista no", async () => {
  render(<Layout><ContactosPage /></Layout>);
  const ver = await screen.findByTestId("ver-n1");
  expect(document.body.textContent).not.toContain("SYNTH-NR-1");
  fireEvent.click(ver);
  const estado = await screen.findByTestId("estado-clic");
  expect(estado.textContent).toContain("gclid");
  expect(estado.textContent).toContain("SYNTH-NR-1");
  expect(estado.textContent).not.toMatch(/No ad click recorded/);
});
