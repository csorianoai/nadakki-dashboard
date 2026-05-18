/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockInit = jest.fn();
const mockGetClient = jest.fn<() => unknown | null>();
const mockSetTag = jest.fn();
const mockAddBreadcrumb = jest.fn();
const mockCaptureException = jest.fn();
const mockDistribution = jest.fn();
const mockBrowserTracing = jest.fn(() => ({ name: "BrowserTracing" }));
const mockReplay = jest.fn(() => ({ name: "Replay" }));

jest.mock("@sentry/react", () => ({
  init: (...args: unknown[]) => mockInit(...args),
  getClient: () => mockGetClient(),
  setTag: (...args: unknown[]) => mockSetTag(...args),
  addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  metrics: { distribution: (...args: unknown[]) => mockDistribution(...args) },
  browserTracingIntegration: () => mockBrowserTracing(),
  replayIntegration: () => mockReplay(),
}));

jest.mock("web-vitals", () => ({
  onFCP: (cb: (m: { name: string; value: number; rating?: string; id?: string }) => void) =>
    cb({ name: "FCP", value: 42, rating: "good", id: "fcp-test" }),
  onLCP: () => {},
  onCLS: () => {},
  onTTFB: () => {},
}));

import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import {
  captureApiError,
  captureClientException,
  initClientTelemetry,
  resetClientTelemetryForTests,
  setSentryTenantId,
} from "@/lib/observability/telemetry";
import { initUserActionClickTracking, trackCriticalUserAction, trackPageView } from "@/lib/observability/user-actions";

function Bomb(): never {
  throw new Error("observability-test-bomb");
}

describe("initClientTelemetry", () => {
  const origDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const origEnv = process.env.NODE_ENV;
  const origTelemetry = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
  const origSample = process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE;

  beforeEach(() => {
    resetClientTelemetryForTests();
    mockInit.mockClear();
    mockBrowserTracing.mockClear();
    mockReplay.mockClear();
    delete process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
    delete process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE;
  });

  afterEach(() => {
    resetClientTelemetryForTests();
    process.env.NEXT_PUBLIC_SENTRY_DSN = origDsn;
    process.env.NODE_ENV = origEnv;
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = origTelemetry;
    process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE = origSample;
  });

  test("skips Sentry.init when DSN is missing", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.NODE_ENV = "development";
    initClientTelemetry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  test("skips Sentry.init when NEXT_PUBLIC_ENABLE_TELEMETRY is false", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "false";
    process.env.NODE_ENV = "development";
    initClientTelemetry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  test("uses NEXT_PUBLIC_SENTRY_SAMPLE_RATE and registers tracing + replay", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE = "0.42";
    initClientTelemetry();
    expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0.42);
    expect(mockInit.mock.calls[0][0].integrations).toHaveLength(2);
    expect(mockBrowserTracing).toHaveBeenCalled();
    expect(mockReplay).toHaveBeenCalled();
  });
});

describe("Sentry capture helpers", () => {
  beforeEach(() => {
    resetClientTelemetryForTests();
    mockSetTag.mockClear();
    mockCaptureException.mockClear();
    mockGetClient.mockReturnValue({});
  });

  test("setSentryTenantId and captureClientException forward to SDK", () => {
    setSentryTenantId("  ");
    expect(mockSetTag).toHaveBeenCalledWith("tenant_id", "unknown");
    captureClientException(new Error("boom"), { where: "test" });
    expect(mockCaptureException).toHaveBeenCalled();
  });

  test("captureApiError tags api_error", () => {
    captureApiError(new Error("bad"), { status: 500, endpoint: "/api/x", tenantId: "mx" });
    expect(mockCaptureException.mock.calls[0][1]?.tags?.kind).toBe("api_error");
  });
});

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    mockGetClient.mockReturnValue({});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders fallback UI when a child throws", () => {
    render(
      <RouteErrorBoundary segment="seg.bad">
        <Bomb />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
  });
});

describe("user-action telemetry", () => {
  beforeEach(() => {
    mockAddBreadcrumb.mockClear();
    mockSetTag.mockClear();
    mockGetClient.mockReturnValue({});
  });

  test("trackPageView sets route and navigation breadcrumb", () => {
    trackPageView("/bank/applications/1?x=1", "tenant-a");
    expect(mockSetTag).toHaveBeenCalledWith("route", "/bank/applications/1");
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: "page_view", category: "navigation" }),
    );
  });

  test("trackCriticalUserAction and delegated clicks emit breadcrumbs", async () => {
    trackCriticalUserAction("claim", { application_id: "1" }, "t");
    const user = userEvent.setup();
    const detach = initUserActionClickTracking();
    render(
      <button type="button" data-nadakki-track="demo.action">
        go
      </button>,
    );
    await user.click(screen.getByRole("button", { name: "go" }));
    detach();
    const messages = mockAddBreadcrumb.mock.calls.map((c) => c[0]?.message);
    expect(messages).toEqual(expect.arrayContaining(["claim", "demo.action"]));
  });
});
