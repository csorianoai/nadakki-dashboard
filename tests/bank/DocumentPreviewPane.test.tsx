/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentPreviewPane } from "@/components/bank/DocumentPreviewPane";
import { buildPreviewFetchInit } from "@/lib/bank/document-preview-api";

jest.mock("@/hooks/useDocumentPreview", () => ({
  __esModule: true,
  useDocumentPreview: jest.fn(),
}));

import { useDocumentPreview } from "@/hooks/useDocumentPreview";

jest.mock("react-pdf", () => {
  const ReactLib = jest.requireActual("react");
  return {
    pdfjs: { version: "4.10.43", GlobalWorkerOptions: {} },
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children?: React.ReactNode;
      onLoadSuccess?: (d: { numPages: number }) => void;
    }) => {
      ReactLib.useEffect(() => {
        onLoadSuccess?.({ numPages: 4 });
      }, [onLoadSuccess]);
      return <div>{children}</div>;
    },
    Page: ({
      pageNumber,
      scale,
      width,
      rotate,
    }: {
      pageNumber?: number;
      scale?: number;
      width?: number;
      rotate?: number;
    }) => (
      <div
        data-testid={`pdf-page-${pageNumber ?? 1}`}
        data-scale={scale ?? ""}
        data-width={width ?? ""}
        data-rotate={rotate ?? ""}
      />
    ),
  };
});

const mockedUsePreview = useDocumentPreview as jest.Mock;

function pdfBlob() {
  return new Blob(["%PDF-1.4 mocked"], { type: "application/pdf" });
}

function okBlobResponse(blob: Blob) {
  return {
    ok: true,
    status: 200,
    blob: async () => blob,
  };
}

describe("DocumentPreviewPane", () => {
  const refetchSpy = jest.fn();
  let openSpy: jest.SpyInstance;
  let promptSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePreview.mockReturnValue({
      metadata: { pages: 4 },
      loading: false,
      error: null,
      refetch: refetchSpy,
    });

    global.fetch = jest.fn().mockResolvedValue(okBlobResponse(pdfBlob()) as any);

    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-primary") as any;
    global.URL.revokeObjectURL = jest.fn() as any;

    openSpy = jest.spyOn(window, "open").mockReturnValue(null);
    promptSpy = jest.spyOn(window, "prompt").mockReturnValue("");
  });

  afterEach(() => {
    openSpy.mockRestore();
    promptSpy.mockRestore();
  });

  it("test_renders_pdf_viewer", async () => {
    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
      expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument();
    });
  });

  it("test_thumbnail_sidebar_navigation", async () => {
    const user = userEvent.setup();

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument());

    const thumb = await screen.findByRole("button", { name: /mini página 3/i });
    await user.click(thumb);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-page-3")).toBeInTheDocument();
    });
  });

  it("test_zoom_50_100_150_200_fit", async () => {
    const user = userEvent.setup();

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument());

    const btn50 = screen.getByRole("button", { name: "50%" });
    await user.click(btn50);
    expect(btn50.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => {
      expect(screen.getByTestId("pdf-page-1")).toHaveAttribute("data-scale", "0.5");
    });

    await user.click(screen.getByTestId("zoom-fit-width"));
    await user.click(screen.getByTestId("zoom-fit-page"));
  });

  it("test_rotation_90_180_270", async () => {
    const user = userEvent.setup();

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument());

    await user.click(screen.getByTestId("rotate-90"));
    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toHaveAttribute("data-rotate", "90"));

    await user.click(screen.getByTestId("rotate-180"));
    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toHaveAttribute("data-rotate", "270"));

    await user.click(screen.getByTestId("rotate-270-minus90"));
    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toHaveAttribute("data-rotate", "180"));
  });

  it("test_page_navigation_first_prev_next_last", async () => {
    const user = userEvent.setup();

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("page-indicator")).toHaveTextContent("1 / 4"));

    await user.click(screen.getByTestId("page-next"));
    await waitFor(() => expect(screen.getByTestId("page-indicator")).toHaveTextContent("2 / 4"));

    await user.click(screen.getByTestId("page-prev"));
    await waitFor(() => expect(screen.getByTestId("page-indicator")).toHaveTextContent("1 / 4"));

    await user.click(screen.getByTestId("page-last"));
    await waitFor(() => expect(screen.getByTestId("page-indicator")).toHaveTextContent("4 / 4"));

    await user.click(screen.getByTestId("page-first"));
    await waitFor(() => expect(screen.getByTestId("page-indicator")).toHaveTextContent("1 / 4"));
  });

  it("test_side_by_side_comparison_mode", async () => {
    const user = userEvent.setup();
    promptSpy.mockReturnValue("doc-b ");

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("pdf-document")).toBeInTheDocument());

    await user.click(screen.getByTestId("compare-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("comparison-pane")).toBeInTheDocument();
      expect(screen.getByText(/Comparativo · doc-b/)).toBeInTheDocument();
    });
  });

  it("test_download_triggers", async () => {
    const user = userEvent.setup();
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("download-doc")).not.toBeDisabled());

    await user.click(screen.getByTestId("download-doc"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("test_print_triggers", async () => {
    const user = userEvent.setup();
    const printFn = jest.fn();
    openSpy.mockReturnValue({ focus: jest.fn(), print: printFn, close: jest.fn() } as any);

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("print-doc")).toBeInTheDocument());

    await user.click(screen.getByTestId("print-doc"));

    expect(window.open).toHaveBeenCalledWith("blob:mock-primary", "_blank");
    expect(printFn).toHaveBeenCalled();
  });

  it("test_mobile_pinch_zoom", async () => {
    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("pdf-main-view")).toBeInTheDocument());

    const viewer = screen.getByTestId("pdf-main-view");

    fireEvent.touchStart(viewer, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 10, clientY: 0 },
      ],
    });

    fireEvent.touchMove(viewer, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 30, clientY: 0 },
      ],
    });

    await waitFor(() => {
      const scale = Number(screen.getByTestId("pdf-page-1").getAttribute("data-scale"));
      expect(Number.isFinite(scale)).toBe(true);
      expect(scale).toBeGreaterThan(1);
    });
  });

  it("test_loading_state", () => {
    mockedUsePreview.mockReturnValue({
      metadata: null,
      loading: true,
      error: null,
      refetch: refetchSpy,
    });

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    expect(screen.getByTestId("preview-loading-meta")).toHaveTextContent(/Cargando metadatos/i);
  });

  it("test_error_state_friendly_message", () => {
    mockedUsePreview.mockReturnValue({
      metadata: null,
      loading: false,
      error: "Preview meta falló (403)",
      refetch: refetchSpy,
    });

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    const alert = screen.getByTestId("preview-error");
    expect(alert.getAttribute("role")).toBe("alert");
    expect(alert.textContent ?? "").toMatch(/403/);
    expect(alert.textContent ?? "").toMatch(/Revise Tenant/i);
  });

  it("test_caching_works", async () => {
    const user = userEvent.setup();

    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(() => expect(screen.getByTestId("reload-meta")).toBeInTheDocument());

    await user.click(screen.getByTestId("reload-meta"));

    expect(refetchSpy).toHaveBeenCalled();

    expect((global.fetch as jest.Mock).mock.calls.some(([, init]) => (init?.cache ?? null) === "default")).toBe(
      true,
    );
  });

  it("test_accessibility_keyboard_navigation", async () => {
    render(<DocumentPreviewPane documentId="doc-a" applicationId="app-1" tenantId="tenant-99" />);

    await waitFor(async () =>
      screen.findByRole("button", { name: /mini página 2/i }),
    );

    const page2Thumb = screen.getByRole("button", { name: /mini página 2/i });
    fireEvent.keyDown(page2Thumb, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("pdf-page-2")).toBeInTheDocument();
    });
  });
});

describe("preview API headers", () => {
  it("test_tenant_header_sent", () => {
    const headers = (
      buildPreviewFetchInit("  tenant-uuid  ", "tok-en", {}) as RequestInit & { headers: Headers }
    ).headers;
    expect(headers.get("X-Tenant-ID")).toBe("tenant-uuid");
    expect(headers.get("Authorization")).toBe("Bearer tok-en");

    const bearerOff = (
      buildPreviewFetchInit("tenant-uuid", undefined, {}) as RequestInit & { headers: Headers }
    ).headers;
    expect(bearerOff.get("Authorization")).toBeNull();
  });
});
