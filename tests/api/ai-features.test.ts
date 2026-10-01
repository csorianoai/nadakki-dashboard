import { autosFetch } from "@/lib/autos-consumer-api";
import { getPriceConfidence, getVehicleHistory } from "@/lib/api/ai-features";

jest.mock("@/lib/autos-consumer-api", () => ({
  autosFetch: jest.fn(),
}));

const mockedAutosFetch = autosFetch as jest.MockedFunction<typeof autosFetch>;

describe("AI evidence fail-closed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not fabricate a price range or sample when the backend fails", async () => {
    mockedAutosFetch.mockRejectedValueOnce(new Error("backend unavailable"));

    await expect(getPriceConfidence("veh-1", 1_000_000)).resolves.toEqual({
      lo: null,
      mid: null,
      hi: null,
      top: null,
      pos: null,
      pctBetter: null,
      sampleCount: null,
      fromBackend: false,
    });
  });

  it("preserves measured price evidence returned by the backend", async () => {
    mockedAutosFetch.mockResolvedValueOnce({
      price_lo_rd: 900,
      price_mid_rd: 1000,
      price_hi_rd: 1100,
      price_top_rd: 1200,
      position_pct: 33,
      pct_below_market: 9,
      sample_count: 12,
    });

    await expect(getPriceConfidence("veh-1")).resolves.toEqual({
      lo: 900,
      mid: 1000,
      hi: 1100,
      top: 1200,
      pos: 33,
      pctBetter: 9,
      sampleCount: 12,
      fromBackend: true,
    });
  });

  it("does not fabricate benign vehicle history when the backend fails", async () => {
    mockedAutosFetch.mockRejectedValueOnce(new Error("backend unavailable"));

    await expect(getVehicleHistory("veh-1")).resolves.toEqual({
      events: [],
      verifications: [],
      fromBackend: false,
    });
  });

  it("preserves history evidence returned by the backend", async () => {
    mockedAutosFetch.mockResolvedValueOnce({
      events: [{ label: "Registro verificado", status: "ok" }],
      verifications: ["Fuente oficial"],
    });

    await expect(getVehicleHistory("veh-1")).resolves.toEqual({
      events: [{ label: "Registro verificado", status: "ok" }],
      verifications: ["Fuente oficial"],
      fromBackend: true,
    });
  });
});
