import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FilePickerInput } from "@/components/customer/upload/FilePickerInput";
import { MobileCameraInput } from "@/components/customer/upload/MobileCameraInput";
import { TokenValidator } from "@/components/customer/upload/TokenValidator";
import { UploadFailure } from "@/components/customer/upload/UploadFailure";
import { UploadProgress } from "@/components/customer/upload/UploadProgress";
import { UploadSuccess } from "@/components/customer/upload/UploadSuccess";

describe("EP-T4-5 mobile upload components", () => {
  test("MobileCameraInput uses capture environment", () => {
    render(<MobileCameraInput id="c" accept="image/*" onFile={() => {}} />);
    const input = document.getElementById("c") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("capture", "environment");
    expect(input).toHaveAttribute("type", "file");
  });

  test("FilePickerInput allows multiple selection", () => {
    render(<FilePickerInput id="p" accept=".pdf" onFiles={() => {}} />);
    const input = document.getElementById("p") as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");
  });

  test("UploadProgress exposes progressbar semantics", () => {
    render(<UploadProgress percent={42} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  test("UploadProgress cancel control is large enough target", () => {
    const onCancel = jest.fn();
    render(<UploadProgress percent={10} onCancel={onCancel} />);
    const btn = screen.getByRole("button", { name: /cancelar envío/i });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(btn);
    expect(onCancel).toHaveBeenCalled();
  });

  test("UploadSuccess shows confirmation", () => {
    render(<UploadSuccess />);
    expect(screen.getByText(/recibimos tu documento/i)).toBeInTheDocument();
  });

  test("UploadFailure triggers retry", () => {
    const onRetry = jest.fn();
    render(<UploadFailure message="x" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  test("TokenValidator shows loading then ready", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        stipulation_id: "33333333-3333-3333-3333-333333333333",
        max_size_mb: 5,
        allowed_types: ["application/pdf"],
      }),
    }) as unknown as typeof fetch;

    render(
      <TokenValidator token="t" applicationId="a" stipulationId="s">
        {() => <p>Form ready</p>}
      </TokenValidator>,
    );
    expect(screen.getByText(/verificando enlace/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Form ready")).toBeInTheDocument());
  });

  test("TokenValidator maps 409 to already-used copy", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: "x" }),
    }) as unknown as typeof fetch;

    render(
      <TokenValidator token="t" applicationId="a" stipulationId="s">
        {() => <p>no</p>}
      </TokenValidator>,
    );
    await waitFor(() => expect(screen.getByText(/ya fue usado/i)).toBeInTheDocument());
  });
});
