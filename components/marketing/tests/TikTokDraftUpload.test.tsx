import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TikTokDraftUpload, { validateTikTokVideo } from "../TikTokDraftUpload";
import * as api from "@/lib/api/marketing";

describe("validateTikTokVideo", () => {
  it("acepta MP4 y MOV dentro del límite", () => {
    expect(validateTikTokVideo({ type: "video/mp4", size: 1000 })).toBeNull();
    expect(validateTikTokVideo({ type: "video/quicktime", size: 1000 })).toBeNull();
  });
  it("rechaza otros tipos", () => {
    expect(validateTikTokVideo({ type: "image/png", size: 1000 })).toMatch(/MP4 o MOV/);
  });
  it("rechaza archivos vacíos y de más de 50 MB", () => {
    expect(validateTikTokVideo({ type: "video/mp4", size: 0 })).toMatch(/vacío/);
    expect(validateTikTokVideo({ type: "video/mp4", size: 50 * 1024 * 1024 + 1 })).toMatch(/50 MB/);
  });
});

describe("TikTokDraftUpload", () => {
  afterEach(() => jest.restoreAllMocks());

  it("bloquea el envío hasta elegir un video válido", () => {
    render(<TikTokDraftUpload />);
    expect(screen.getByRole("button", { name: /Enviar borrador/ })).toBeDisabled();
  });

  it("muestra error para un tipo no permitido sin llamar a la API", () => {
    const spy = jest.spyOn(api, "uploadTikTokDraft");
    render(<TikTokDraftUpload />);
    const input = screen.getByLabelText(/Video/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    expect(screen.getByText(/Solo se aceptan/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar borrador/ })).toBeDisabled();
    expect(spy).not.toHaveBeenCalled();
  });

  it("sube el video y muestra el publish_id", async () => {
    jest.spyOn(api, "uploadTikTokDraft").mockResolvedValue({ ok: true, publishId: "p123" });
    render(<TikTokDraftUpload />);
    const input = screen.getByLabelText(/Video/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "demo.mp4", { type: "video/mp4" })] } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar borrador/ }));
    await waitFor(() => expect(screen.getByText(/Borrador creado en TikTok/)).toBeInTheDocument());
    expect(screen.getByText(/p123/)).toBeInTheDocument();
  });

  it("muestra el error que devuelve el backend", async () => {
    jest.spyOn(api, "uploadTikTokDraft").mockResolvedValue({ ok: false, error: "La conexión de TikTok expiró. Reconéctala." });
    render(<TikTokDraftUpload />);
    const input = screen.getByLabelText(/Video/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "demo.mp4", { type: "video/mp4" })] } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar borrador/ }));
    await waitFor(() => expect(screen.getByText(/expiró/)).toBeInTheDocument());
  });
});
