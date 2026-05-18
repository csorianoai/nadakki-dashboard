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

import { RouteErrorBoundary, withRouteErrorBoundary } from "@/lib/observability/error-boundary";
import {
  captureApiError,
  captureClientException,
  initClientTelemetry,
  resetClientTelemetryForTests,
  setSentryTenantId,
} from "@/lib/observability/telemetry";
import {
  flushPerformanceMetrics,
  initPerformanceReporting,
  teardownPerformanceReporting,
} from "@/lib/observability/performance";
import {
  initUserActionClickTracking,
  trackCriticalUserAction,
  trackPageView,
} from "@/lib/observability/user-actions";


describe("initClientTelemetry", () => {
  const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetClientTelemetryForTests();
    mockInit.mockClear();
    mockBrowserTracing.mockClear();
    mockReplay.mockClear();
  });

  afterEach(() => {
    resetClientTelemetryForTests();
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
    process.env.NODE_ENV = originalEnv;
  });

  test("skips Sentry.init when DSN is missing", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.NODE_ENV = "development";
    initClientTelemetry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  test("uses prod tracesSampleRate and registers tracing + replay integrations", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NODE_ENV = "production";
    initClientTelemetry();
    expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0.1);
    const integrations = mockInit.mock.calls[0][0].integrations;
    expect(integrations).toHaveLength(2);
    expect(mockBrowserTracing).toHaveBeenCalled();
    expect(mockReplay).toHaveBeenCalled();
  });
});

describe("telemetry tagging, client exceptions, and API errors", () => {
  beforeEach(() => {
    resetClientTelemetryForTests();
    mockSetTag.mockClear();
    mockCaptureException.mockClear();
    mockGetClient.mockReturnValue({});
  });

  test("setSentryTenantId falls back to unknown", () => {
    setSentryTenantId("  ");
    expect(mockSetTag).toHaveBeenCalledWith("tenant_id", "unknown");
  });

  test("captureClientException forwards when client exists", () => {
    captureClientException(new Error("boom"), { where: "test" });
    expect(mockCaptureException).toHaveBeenCalled();
  });

  test("captureApiError records a tagged exception", () => {
    captureApiError(new Error("bad"), { status: 500, endpoint: "/api/x", tenantId: "mx" });
    expect(mockCaptureException.mock.calls[0][1]?.tags?.kind).toBe("api_error");
  });
});

function Bomb(): never {
  throw new Error("observability-test-bomb");
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    mockGetClient.mockReturnValue({});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders children when there is no error", () => {
    render(
      <RouteErrorBoundary segment="seg.ok">
        <span>healthy</span>
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  test("renders route fallback when a child throws", () => {
    render(
      <RouteErrorBoundary segment="seg.bad">
        <Bomb />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("withRouteErrorBoundary", () => {
  test("wraps a component in RouteErrorBoundary", () => {
    const Inner = () => <em>wrapped</em>;
    const Wrapped = withRouteErrorBoundary("seg.hoc")(Inner);
    render(<Wrapped />);
    expect(screen.getByText("wrapped")).toBeInTheDocument();
  });
});

describe("performance reporting", () => {
  beforeEach(() => {
    mockAddBreadcrumb.mockClear();
    mockDistribution.mockClear();
    mockGetClient.mockReturnValue({});
    teardownPerformanceReporting();
  });

  afterEach(() => {
    teardownPerformanceReporting();
  });

  test("init collects vitals and flushPerformanceMetrics emits a batch breadcrumb", () => {
    initPerformanceReporting();
    flushPerformanceMetrics();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "performance",
        message: "web_vitals_batch",
      }),
    );
    expect(mockDistribution).toHaveBeenCalled();
  });

  test("teardown clears timers so flush is a no-op when buffer is empty", () => {
    initPerformanceReporting();
    flushPerformanceMetrics();
    mockAddBreadcrumb.mockClear();
    teardownPerformanceReporting();
    flushPerformanceMetrics();
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });
});

describe("user action + navigation breadcrumbs", () => {
  beforeEach(() => {
    mockAddBreadcrumb.mockClear();
    mockSetTag.mockClear();
    mockGetClient.mockReturnValue({});
  });

  test("trackPageView sets route tag and breadcrumb", () => {
    trackPageView("/bank/applications/1?x=1", "tenant-a");
    expect(mockSetTag).toHaveBeenCalledWith("route", "/bank/applications/1");
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: "page_view", category: "navigation" }),
    );
  });

  test("trackCriticalUserAction records claim and upload kinds", () => {
    trackCriticalUserAction("claim", { application_id: "1" }, "t");
    trackCriticalUserAction("upload", { document_type: "id" }, "t");
    const messages = mockAddBreadcrumb.mock.calls.map((c) => c[0]?.message);
    expect(messages).toEqual(expect.arrayContaining(["claim", "upload"]));
  });

  test("initUserActionClickTracking records data-nadakki-track clicks", async () => {
    const user = userEvent.setup();
    const detach = initUserActionClickTracking();
    render(
      <button type="button" data-nadakki-track="demo.action">
        go
      </button>,
    );
    await user.click(screen.getByRole("button", { name: "go" }));
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: "ui.click", message: "demo.action" }),
    );
    detach();
  });
});
