import { autosFetch } from "@/lib/autos-consumer-api";
import { matchApproval } from "@/lib/api/finance";

jest.mock("@/lib/autos-consumer-api", () => ({
  autosFetch: jest.fn(),
}));

const mockedAutosFetch = autosFetch as jest.MockedFunction<typeof autosFetch>;

describe("matchApproval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("declares the score unavailable when the backend fails", async () => {
    mockedAutosFetch.mockRejectedValueOnce(new Error("backend unavailable"));

    await expect(matchApproval()).resolves.toEqual({
      score: undefined,
      fromBackend: false,
    });
  });

  it("uses the backend score when the request succeeds", async () => {
    mockedAutosFetch.mockResolvedValueOnce({ match_score: 72 });

    await expect(matchApproval()).resolves.toEqual({
      score: 72,
      fromBackend: true,
    });
  });
});
