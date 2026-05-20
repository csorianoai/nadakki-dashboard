/**
 * @jest-environment jsdom
 */

import {
  mergeQueueApplications,
  parseRealtimeEnvelope,
  parseRealtimeMessage,
  eventToMergeMode,
} from "@/lib/realtime/event-handlers";
import {
  buildWebSocketUrl,
  getJwtForWebSocket,
  getRealtimeTenantId,
  nextReconnectDelayMs,
} from "@/lib/realtime/websocket-client";
import { tokenStorage } from "@/lib/auth/token-storage";

describe("nextReconnectDelayMs", () => {
  test("stays within max bound", () => {
    expect(nextReconnectDelayMs(20, 1000, 30_000)).toBeLessThanOrEqual(30_000);
  });

  test("increases with attempts", () => {
    const a = nextReconnectDelayMs(1, 1000, 30_000);
    const b = nextReconnectDelayMs(4, 1000, 30_000);
    expect(b).toBeGreaterThanOrEqual(a);
  });
});

describe("buildWebSocketUrl", () => {
  test("appends access_token and tenant_id", () => {
    const url = buildWebSocketUrl("wss://example.test/ws", "tok", "t1");
    expect(url).toContain("access_token=tok");
    expect(url).toContain("tenant_id=t1");
  });
});

describe("parseRealtimeMessage", () => {
  test("parses application.updated style payloads", () => {
    const ev = parseRealtimeMessage(
      JSON.stringify({
        type: "application.updated",
        application_id: "a1",
        applicant_name: "Jane",
        state: "pending",
      }),
    );
    expect(ev?.kind).toBe("application.updated");
    if (ev?.kind === "application.updated") {
      expect(ev.application.application_id).toBe("a1");
    }
  });

  test("returns null for invalid json", () => {
    expect(parseRealtimeMessage("{")).toBeNull();
  });
});

describe("mergeQueueApplications", () => {
  test("prepends new application", () => {
    const next = mergeQueueApplications(
      [],
      { application_id: "x", applicant_name: "A", state: "new" },
      "prepend",
    );
    expect(next).toHaveLength(1);
    expect(next[0].application_id).toBe("x");
  });

  test("updates existing by id in place", () => {
    const base = mergeQueueApplications(
      [],
      { application_id: "x", state: "old" },
      "prepend",
    );
    const next = mergeQueueApplications(base, { application_id: "x", state: "new" }, "update");
    expect(next).toHaveLength(1);
    expect(next[0].state).toBe("new");
  });
});

describe("parseRealtimeEnvelope", () => {
  test("parses envelope object", () => {
    const env = parseRealtimeEnvelope('{"type":"ev","channel":"c"}');
    expect(env?.type).toBe("ev");
    expect(env?.channel).toBe("c");
  });
});

describe("eventToMergeMode", () => {
  test("maps create vs update", () => {
    expect(
      eventToMergeMode({ kind: "application.created", application: { application_id: "a" } }),
    ).toBe("prepend");
    expect(
      eventToMergeMode({ kind: "application.updated", application: { application_id: "a" } }),
    ).toBe("update");
    expect(eventToMergeMode({ kind: "ping" })).toBeNull();
  });
});

describe("tenant id helper", () => {
  test("reads nadakki_tenant_id from localStorage", () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-xyz");
    expect(getRealtimeTenantId()).toBe("tenant-xyz");
    window.localStorage.removeItem("nadakki_tenant_id");
  });
});

describe("JWT for websocket", () => {
  test("prefers Auth V2 access token when present", () => {
    tokenStorage.setTokens({ accessToken: "v2tok", refreshToken: "r" });
    expect(getJwtForWebSocket()).toBe("v2tok");
    tokenStorage.clearTokens();
  });
});

describe("parseRealtimeMessage offers", () => {
  test("parses offer.received", () => {
    const ev = parseRealtimeMessage(
      JSON.stringify({
        type: "credit.offer",
        application_id: "app1",
        offer: { apr: "9.5" },
      }),
    );
    expect(ev?.kind).toBe("offer.received");
  });
});
