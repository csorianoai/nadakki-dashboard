import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentsTab } from "@/components/credit-hub/bank/sections/DocumentsTab";

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "", variable: "" }),
  JetBrains_Mono: () => ({ className: "", variable: "" }),
  Source_Serif_4: () => ({ className: "", variable: "" }),
}));

jest.mock("@/components/credit-hub/bank/sections/DocumentRequestsPanel", () => ({
  DocumentRequestsPanel: () => null,
}));

const mockGetAccessToken = jest.fn(() => "test-token");

jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => mockGetAccessToken() },
}));

jest.mock("@/lib/bank-application-detail/fetch-detail", () => ({
  readBankApplicationAuthToken: jest.fn(() => null),
  buildBankApplicationDetailHeadersWithRole: jest.fn(() => ({
    Authorization: "Bearer test-token",
    "X-Tenant-ID": "tenant-1",
    "X-Role": "BANK_ANALYST",
    "X-Correlation-ID": "corr-1",
  })),
}));

describe("DocumentsTab", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockGetAccessToken.mockReset().mockReturnValue("test-token");
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  test("enables document button when the document has an id", () => {
    render(<DocumentsTab docs={[{ id: "d1", name: "Cédula", status: "pendiente" }]} />);
    const btn = screen.getByRole("button", { name: /ver documento/i });
    expect(btn).not.toBeDisabled();
  });

  test("downloads the document with Bearer auth and opens the PDF blob", async () => {
    const user = userEvent.setup();
    const popup = { location: { href: "" }, close: jest.fn(), opener: window };
    jest.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn(() => "blob:document") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() });
    const fetchMock = jest.fn().mockResolvedValue(
      { ok: true, status: 200, blob: jest.fn().mockResolvedValue(new Blob(["%PDF-1.7"], { type: "application/pdf" })) },
    );
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });

    render(<DocumentsTab docs={[{ id: "doc-1", name: "Cédula", status: "uploaded" }]} applicationId="app-1" />);
    await user.click(screen.getByRole("button", { name: /ver documento/i }));

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(popup.opener).toBeNull();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-1/documents/doc-1/download",
      expect.objectContaining({
        credentials: "omit",
        headers: expect.objectContaining({ Authorization: "Bearer test-token", "X-Tenant-ID": "tenant-1" }),
      }),
    ));
    expect(popup.location.href).toBe("blob:document");
  });

  test("does not open a document without a session", () => {
    mockGetAccessToken.mockReturnValueOnce(null);
    const openSpy = jest.spyOn(window, "open");

    render(<DocumentsTab docs={[{ id: "doc-1", name: "Cédula", status: "uploaded" }]} applicationId="app-1" />);

    expect(screen.getByRole("button", { name: /ver documento/i })).toBeDisabled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  test("does not open a document rejected for another application", async () => {
    const user = userEvent.setup();
    const popup = { location: { href: "" }, close: jest.fn() };
    jest.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    const createObjectUrl = jest.fn(() => "blob:document");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });

    render(<DocumentsTab docs={[{ id: "doc-from-app-2", name: "Cédula", status: "uploaded" }]} applicationId="app-1" />);
    await user.click(screen.getByRole("button", { name: /ver documento/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-1/documents/doc-from-app-2/download",
      expect.objectContaining({ credentials: "omit" }),
    ));
    expect(popup.close).toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  test("does not enable a document without id or doc_id", () => {
    render(<DocumentsTab docs={[{ filename: "sin-id.pdf" }]} applicationId="app-1" />);

    expect(screen.getByText("Documento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver documento/i })).toBeDisabled();
  });
});
