import { act, renderHook, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { useStipulations } from "@/hooks/useStipulations";
import * as api from "@/lib/api/stipulations";
import {
  __readWorkflowAuditForTests,
  __resetWorkflowAuditForTests,
} from "@/lib/bank/stipulations/workflow-audit";

jest.mock("swr");

jest.mock("@/lib/api/stipulations", () => ({
  getStipulations: jest.fn(),
  createStipulation: jest.fn(),
  postStipulationUploadLink: jest.fn(),
  notifyDealerStipulationWorkflow: jest.fn(),
  verifyStipulation: jest.fn(),
  rejectStipulation: jest.fn(),
}));

const mockUseSWR = useSWR as unknown as jest.Mock;

describe("useStipulations", () => {
  let mutateFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("nadakki_role", "tenant_admin");
    __resetWorkflowAuditForTests();
    mutateFn = jest.fn().mockResolvedValue(undefined);
    mockUseSWR.mockReturnValue({
      data: [
        { id: "s1", description: "A", status: "pending" as const },
        { id: "s2", description: "B", status: "uploaded" as const },
      ],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mutateFn,
    });
    (api.createStipulation as jest.Mock).mockResolvedValue({
      id: "new",
      description: "n",
      status: "pending",
    });
    (api.postStipulationUploadLink as jest.Mock).mockResolvedValue({
      stipulation_id: "s1",
      upload_url: "https://u",
      token: "t",
      expires_at: "2026-01-01T00:00:00.000Z",
      qr_payload: "",
    });
    (api.notifyDealerStipulationWorkflow as jest.Mock).mockResolvedValue({ ok: true, unsupported: false });
    (api.verifyStipulation as jest.Mock).mockResolvedValue({});
    (api.rejectStipulation as jest.Mock).mockResolvedValue({});
  });

  test("create records tenant-scoped audit and calls API", async () => {
    const { result } = renderHook(() => useStipulations("app-1", "tenant-a"));
    await act(async () => {
      await result.current.create({ type: "other", dealer_id: "dealer-uuid" });
    });
    expect(api.createStipulation).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ type: "other", dealer_id: "dealer-uuid" }),
      "TENANT_ADMIN",
    );
    const keys = __readWorkflowAuditForTests().map((e) => `${e.tenant_key}:${e.action}`);
    expect(keys.some((k) => k.startsWith("tenant-a:stipulation_create"))).toBe(true);
  });

  test("tenant B does not overwrite tenant A audit namespace", async () => {
    const { result: ra } = renderHook(() => useStipulations("app-1", "tenant-a"));
    await act(async () => {
      await ra.current.create({ type: "other", dealer_id: "d1" });
    });
    __resetWorkflowAuditForTests();
    const { result: rb } = renderHook(() => useStipulations("app-1", "tenant-b"));
    await act(async () => {
      await rb.current.create({ type: "cedula_front", dealer_id: "d1" });
    });
    const tenantKeys = __readWorkflowAuditForTests().map((e) => e.tenant_key);
    expect(tenantKeys.every((k) => k === "tenant-b")).toBe(true);
  });

  test("sendPendingToDealer uploads links and notifies", async () => {
    const { result } = renderHook(() => useStipulations("app-1", "t1"));
    let r!: Awaited<ReturnType<typeof result.current.sendPendingToDealer>>;
    await act(async () => {
      r = await result.current.sendPendingToDealer();
    });
    expect(r.notifyOk).toBe(true);
    expect(api.postStipulationUploadLink).toHaveBeenCalled();
    expect(api.notifyDealerStipulationWorkflow).toHaveBeenCalledWith("app-1", ["s1"], "TENANT_ADMIN");
  });

  test("sendPendingToDealer surfaces unsupported notify without throwing", async () => {
    (api.notifyDealerStipulationWorkflow as jest.Mock).mockResolvedValueOnce({ ok: false, unsupported: true });
    const { result } = renderHook(() => useStipulations("app-1", "t1"));
    let r!: Awaited<ReturnType<typeof result.current.sendPendingToDealer>>;
    await act(async () => {
      r = await result.current.sendPendingToDealer();
    });
    expect(r.notifyUnsupported).toBe(true);
    expect(r.notifyOk).toBe(false);
  });

  test("verify emits workflow audit", async () => {
    const { result } = renderHook(() => useStipulations("app-1", "tenant-x"));
    await act(async () => {
      await result.current.verify("s2");
    });
    expect(api.verifyStipulation).toHaveBeenCalled();
    const actions = __readWorkflowAuditForTests().map((e) => e.action);
    expect(actions).toContain("stipulation_verify_request");
    expect(actions).toContain("stipulation_verified");
  });

  test("reject emits workflow audit", async () => {
    const { result } = renderHook(() => useStipulations("app-1", "tenant-x"));
    await act(async () => {
      await result.current.reject("s2", "bad doc");
    });
    expect(api.rejectStipulation).toHaveBeenCalled();
    const actions = __readWorkflowAuditForTests().map((e) => e.action);
    expect(actions).toContain("stipulation_reject_request");
    expect(actions).toContain("stipulation_rejected");
  });

  test("mutate is invoked after create", async () => {
    const { result } = renderHook(() => useStipulations("app-1", null));
    await act(async () => {
      await result.current.create({ type: "other", dealer_id: "d1" });
    });
    await waitFor(() => expect(mutateFn).toHaveBeenCalled());
  });
});
