import {
  HearingsApiError,
  createHearing,
  getHearingConfig,
  getHearingKpis,
  listHearings,
  patchHearingStatus,
} from "@/lib/legal/hearings/hearings-api";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

const TENANT = "tenant-test";

function fakeHearing(overrides: Partial<HearingOut> = {}): HearingOut {
  return {
    id: "h-1",
    tenant_id: TENANT,
    case_id: null,
    external_ref: null,
    title: "Audiencia de fondo",
    description: null,
    hearing_type: "AUDIENCIA_FONDO",
    status: "SCHEDULED",
    hearing_date: "2026-07-01T14:00:00Z",
    duration_minutes: 60,
    location: null,
    courtroom: null,
    judge_name: null,
    jurisdiction: "DO",
    timezone: "America/Santo_Domingo",
    assigned_to_user_id: null,
    notes: null,
    created_by: "user-1",
    updated_by: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function okResponse(body: unknown): Partial<Response> {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}

function errResponse(status: number, body: unknown): Partial<Response> {
  return { ok: false, status, text: async () => JSON.stringify(body) };
}

describe("hearings-api", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("listHearings hits /api/legal/hearings with exact query params + X-Tenant-ID", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ hearings: [fakeHearing()], total: 1 }),
    );
    const res = await listHearings(TENANT, {
      from: "2026-07-01",
      to: "2026-07-31",
      status: "SCHEDULED",
      hearing_type: "AUDIENCIA_FONDO",
      case_id: "case-9",
    });
    expect(res.total).toBe(1);
    expect(res.hearings).toHaveLength(1);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/legal/hearings?");
    expect(url).toContain("from=2026-07-01");
    expect(url).toContain("to=2026-07-31");
    expect(url).toContain("status=SCHEDULED");
    expect(url).toContain("hearing_type=AUDIENCIA_FONDO");
    expect(url).toContain("case_id=case-9");
    expect((init.headers as Record<string, string>)["X-Tenant-ID"]).toBe(TENANT);
  });

  it("listHearings normalizes a missing total to the array length", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(okResponse({ hearings: [fakeHearing()] }));
    const res = await listHearings(TENANT);
    expect(res.total).toBe(1);
  });

  it("getHearingConfig and getHearingKpis hit the right paths (kpis has NO query params)", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        okResponse({
          statuses: ["SCHEDULED"],
          hearing_types: ["AUDIENCIA_FONDO"],
          default_timezone: "America/Santo_Domingo",
          transitions: {},
        }),
      )
      .mockResolvedValueOnce(
        okResponse({
          upcoming_7d: 2,
          overdue: 1,
          completed_30d: 3,
          cancelled_30d: 0,
          by_status: {},
          by_type: {},
          next_hearing: null,
          demo_data: false,
        }),
      );
    await getHearingConfig(TENANT);
    await getHearingKpis(TENANT);
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe("/api/legal/hearings/config");
    expect(calls[1][0]).toBe("/api/legal/hearings/kpis");
  });

  it("createHearing POSTs to /api/legal/hearings and does NOT include tenant_id in the body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(okResponse(fakeHearing()));
    await createHearing(TENANT, { title: "Nueva", hearing_date: "2026-07-01T14:00:00Z" });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/legal/hearings");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty("tenant_id");
    expect(body.title).toBe("Nueva");
    expect((init.headers as Record<string, string>)["X-Tenant-ID"]).toBe(TENANT);
  });

  it("patchHearingStatus PATCHes /{hearing_id}/status with { status, reason? }", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(okResponse(fakeHearing({ status: "CONFIRMED" })));
    await patchHearingStatus(TENANT, "h-1", { status: "CONFIRMED", reason: "ok" });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/legal/hearings/h-1/status");
    expect(init.method).toBe("PATCH");
    const body = JSON.parse(init.body as string);
    expect(body.status).toBe("CONFIRMED");
    expect(body.reason).toBe("ok");
    expect(body).not.toHaveProperty("tenant_id");
  });

  it("maps 403 to a permission message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(errResponse(403, { detail: "Forbidden" }));
    await expect(listHearings(TENANT)).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("permiso"),
    });
  });

  it("surfaces the backend message for 409 and 422", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errResponse(409, { detail: "external_ref ya existe" }),
    );
    await expect(
      createHearing(TENANT, { title: "x", hearing_date: "2026-07-01T14:00:00Z" }),
    ).rejects.toMatchObject({ status: 409, message: "external_ref ya existe" });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errResponse(422, { detail: [{ loc: ["body", "title"], msg: "field required" }] }),
    );
    await expect(
      createHearing(TENANT, { title: "", hearing_date: "" }),
    ).rejects.toMatchObject({ status: 422, message: expect.stringContaining("field required") });
  });

  it("maps a network failure to HearingsApiError status 0 (no crash)", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("boom"));
    const err = await listHearings(TENANT).catch((e) => e);
    expect(err).toBeInstanceOf(HearingsApiError);
    expect(err.status).toBe(0);
  });
});
