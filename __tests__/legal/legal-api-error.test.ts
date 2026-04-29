import { getLegalApiErrorMessage } from "@/lib/legal-api";
import type { APIError } from "@/lib/api/base";

describe("getLegalApiErrorMessage", () => {
  it("reads FastAPI detail string from APIError shape", () => {
    const e = {
      status: 422,
      endpoint: "/api/v1/legal/quick-check",
      error: {
        message: "HTTP 422",
        detail: { detail: "campo inválido" },
      },
    } as APIError;
    expect(getLegalApiErrorMessage(e)).toBe("campo inválido");
  });

  it("falls back to error.message", () => {
    const e: APIError = {
      status: 500,
      endpoint: "/x",
      error: { message: "upstream" },
    };
    expect(getLegalApiErrorMessage(e)).toBe("upstream");
  });
});
