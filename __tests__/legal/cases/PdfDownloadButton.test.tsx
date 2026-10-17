/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PdfDownloadButton } from "@/components/legal/cases/PdfDownloadButton";

describe("PdfDownloadButton", () => {
  it("renders with default label", () => {
    render(<PdfDownloadButton caseId="c1" documentId="d1" tenantId="t1" />);
    expect(screen.getByTestId("pdf-download-button")).toBeInTheDocument();
    expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(
      <PdfDownloadButton caseId="c1" documentId="d1" tenantId="t1" label="Export" />,
    );
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("calls fetch on click", async () => {
    const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    global.fetch = mockFetch;

    const revokeUrl = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "blob:test");
    global.URL.revokeObjectURL = revokeUrl;

    render(<PdfDownloadButton caseId="c1" documentId="d1" tenantId="t1" />);
    fireEvent.click(screen.getByTestId("pdf-download-button"));

    // Wait for async
    await new Promise((r) => setTimeout(r, 50));

    // DASH-LEGAL L1: pasa por apiFetch, que entrega un Headers.
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toEqual(expect.stringContaining("/pdf"));
    expect(new Headers(init.headers).get("X-Tenant-ID")).toBe("t1");
  });

  it("does nothing on failed fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const createUrl = jest.fn();
    global.URL.createObjectURL = createUrl;

    render(<PdfDownloadButton caseId="c1" documentId="d1" tenantId="t1" />);
    fireEvent.click(screen.getByTestId("pdf-download-button"));

    await new Promise((r) => setTimeout(r, 50));
    expect(createUrl).not.toHaveBeenCalled();
  });
});
