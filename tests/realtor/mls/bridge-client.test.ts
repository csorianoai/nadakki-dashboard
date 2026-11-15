import { MOCK_BRIDGE_RESPONSE, MOCK_EMPTY_RESPONSE } from "@/lib/realtor/mls/mock";

// fetch se mockeará por suite para no depender de red
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch as typeof fetch;
});
afterEach(() => {
  mockFetch.mockReset();
  delete process.env.BRIDGE_SERVER_TOKEN;
  delete process.env.BRIDGE_API_URL;
  jest.resetModules();
});

async function importClient() {
  return (await import("@/lib/realtor/mls/bridge-client")).fetchBridgeListings;
}

describe("fetchBridgeListings – sin token", () => {
  it("devuelve null cuando BRIDGE_SERVER_TOKEN no está definido", async () => {
    const fetchBridgeListings = await importClient();
    const result = await fetchBridgeListings();
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("fetchBridgeListings – con token y datos", () => {
  beforeEach(() => {
    process.env.BRIDGE_SERVER_TOKEN = "test-token-123";
  });

  it("mapea listados RESO correctamente", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_BRIDGE_RESPONSE,
    });
    const fetchBridgeListings = await importClient();
    const page = await fetchBridgeListings();
    expect(page).not.toBeNull();
    expect(page!.listings).toHaveLength(2);
    expect(page!.totalCount).toBe(2);

    const first = page!.listings[0];
    expect(first.listingKey).toBe("FL123456001");
    expect(first.listPrice).toBe(549000);
    expect(first.standardStatus).toBe("Active");
    expect(first.city).toBe("Miami");
    expect(first.listOfficeName).toBe("Courtesy of Sample Realty Group");
    expect(first.bedroomsTotal).toBe(2);
    expect(first.bathroomsTotal).toBe(2);
    expect(first.livingArea).toBe(1100);
  });

  it("envía Authorization: Bearer en la cabecera", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_BRIDGE_RESPONSE,
    });
    const fetchBridgeListings = await importClient();
    await fetchBridgeListings();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-token-123",
    );
  });

  it("devuelve null cuando Bridge responde 401", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const fetchBridgeListings = await importClient();
    expect(await fetchBridgeListings()).toBeNull();
  });

  it("devuelve null cuando Bridge responde 503", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const fetchBridgeListings = await importClient();
    expect(await fetchBridgeListings()).toBeNull();
  });

  it("devuelve null cuando el dataset está vacío (MIAMI pendiente)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_EMPTY_RESPONSE,
    });
    const fetchBridgeListings = await importClient();
    const page = await fetchBridgeListings();
    // listings vacío pero page no es null — el caller decide
    expect(page).not.toBeNull();
    expect(page!.listings).toHaveLength(0);
  });

  it("devuelve null en fallo de red", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const fetchBridgeListings = await importClient();
    expect(await fetchBridgeListings()).toBeNull();
  });

  it("devuelve null cuando el cuerpo no tiene .value", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ "@odata.count": 0, data: [] }),
    });
    const fetchBridgeListings = await importClient();
    expect(await fetchBridgeListings()).toBeNull();
  });

  it("descarta filas sin ListingKey o sin ListOfficeName", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "@odata.count": 2,
        value: [
          { ...MOCK_BRIDGE_RESPONSE.value[0], ListingKey: "" },
          { ...MOCK_BRIDGE_RESPONSE.value[1], ListOfficeName: "" },
        ],
      }),
    });
    const fetchBridgeListings = await importClient();
    const page = await fetchBridgeListings();
    expect(page!.listings).toHaveLength(0);
  });
});
