/**
 * @jest-environment node
 *
 * Tests del Route Handler GET /api/realtor/mls/listings.
 * Corre en `node` porque NextRequest necesita los globales Request/Response de Web API.
 * Mockea isBaylaraHost y fetchBridgeListings para aislar la lógica de la ruta.
 */

jest.mock("@/lib/realtor/mls/domain");
jest.mock("@/lib/realtor/mls/bridge-client");

import { isBaylaraHost } from "@/lib/realtor/mls/domain";
import { fetchBridgeListings } from "@/lib/realtor/mls/bridge-client";
import { GET } from "@/app/api/realtor/mls/listings/route";
import { NextRequest } from "next/server";

const mockIsBaylara = isBaylaraHost as jest.Mock;
const mockFetchBridge = fetchBridgeListings as jest.Mock;

const SAMPLE_PAGE = {
  listings: [
    {
      listingKey: "FL123456001",
      listPrice: 549000,
      currency: "USD",
      standardStatus: "Active",
      address: "1250 Brickell Ave",
      city: "Miami",
      stateOrProvince: "FL",
      postalCode: "33131",
      propertyType: "Residential",
      propertySubType: "Condominium",
      bedroomsTotal: 2,
      bathroomsTotal: 2,
      livingArea: 1100,
      listOfficeName: "Sample Realty Group",
      photosCount: 12,
      modificationTimestamp: "2026-11-01T10:00:00Z",
    },
  ],
  totalCount: 1,
  asOf: "2026-11-15T12:00:00Z",
};

function makeRequest(host: string): NextRequest {
  return new NextRequest(`http://${host}/api/realtor/mls/listings`, {
    headers: { host },
  });
}

afterEach(() => {
  mockIsBaylara.mockReset();
  mockFetchBridge.mockReset();
});

describe("GET /api/realtor/mls/listings", () => {
  it("devuelve available:false en host que no es baylara", async () => {
    mockIsBaylara.mockReturnValue(false);
    const res = await GET(makeRequest("nadakki-dashboard.vercel.app"));
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.listings).toHaveLength(0);
    expect(mockFetchBridge).not.toHaveBeenCalled();
  });

  it("devuelve available:false cuando Bridge retorna null (token ausente)", async () => {
    mockIsBaylara.mockReturnValue(true);
    mockFetchBridge.mockResolvedValue(null);
    const res = await GET(makeRequest("baylara.com"));
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.listings).toHaveLength(0);
  });

  it("devuelve available:false cuando Bridge retorna dataset vacío", async () => {
    mockIsBaylara.mockReturnValue(true);
    mockFetchBridge.mockResolvedValue({ listings: [], totalCount: 0, asOf: "2026-11-15T12:00:00Z" });
    const res = await GET(makeRequest("baylara.com"));
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("devuelve listados cuando host es baylara.com y Bridge responde", async () => {
    mockIsBaylara.mockReturnValue(true);
    mockFetchBridge.mockResolvedValue(SAMPLE_PAGE);
    const res = await GET(makeRequest("baylara.com"));
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].listingKey).toBe("FL123456001");
    expect(body.totalCount).toBe(1);
  });

  it("siempre envía Cache-Control: no-store", async () => {
    mockIsBaylara.mockReturnValue(false);
    const res = await GET(makeRequest("localhost:3000"));
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("también Cache-Control: no-store cuando hay datos", async () => {
    mockIsBaylara.mockReturnValue(true);
    mockFetchBridge.mockResolvedValue(SAMPLE_PAGE);
    const res = await GET(makeRequest("baylara.com"));
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});
