import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/lib/legal/archivo-api";
import { PlanYAlmacenamiento, MedidorArchivo, navegadorArchivo } from "@/components/legal/archivo/PlanYAlmacenamiento";

const GB = 1024 ** 3;
const catalogo: api.Catalogo = {
  planes: [
    { code: "legal_esencial", nombre: "Esencial", precio_usd_mes: 79, usuarios: 2, espacio_gb: 10, a_cotizacion: false },
    { code: "legal_profesional", nombre: "Profesional", precio_usd_mes: 199, usuarios: 5, espacio_gb: 50, a_cotizacion: false },
    { code: "legal_premium", nombre: "Premium", precio_usd_mes: 449, usuarios: 15, espacio_gb: 200, a_cotizacion: false },
    { code: "legal_ilimitado", nombre: "Ilimitado", precio_usd_mes: 990, usuarios: null, espacio_gb: 1024, a_cotizacion: true },
  ],
  ampliaciones: [
    { paquete: "50gb", gb: 50, precio_usd_mes: 15, nombre: "+50 GB" },
    { paquete: "250gb", gb: 250, precio_usd_mes: 49, nombre: "+250 GB" },
    { paquete: "1tb", gb: 1024, precio_usd_mes: 149, nombre: "+1 TB" },
  ],
  estudio_genio: [
    { paquete: "completo", nombre: "Estudio Completo", precio_usd: 1500, estrategias: 20, revisiones_abogado: 3 },
    { paquete: "esencial", nombre: "Estudio Esencial", precio_usd: 500, estrategias: 5, revisiones_abogado: 1 },
  ],
  umbral_aviso: 0.8, metodos_disponibles: ["stripe"], datos_transferencia: "",
};
const espacio = (usado: number, nivel: api.Nivel, extra: Partial<api.Espacio> = {}): api.Espacio => ({
  usado_bytes: usado, incluido_gb: 50, ampliaciones_gb: 0, total_bytes: 50 * GB, libre_bytes: Math.max(0, 50 * GB - usado),
  porcentaje: (100 * usado) / (50 * GB), nivel, plan: "legal_profesional", plan_nombre: "Legal Profesional",
  ampliaciones: [], catalogo, ...extra,
});
const envolver = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
afterEach(() => jest.restoreAllMocks());

describe("Plan y almacenamiento", () => {
  it("muestra el uso, el plan actual y las cuatro membresías con el Estudio Genio en todas", async () => {
    jest.spyOn(api, "leerEspacio").mockResolvedValue(espacio(12 * GB, "ok"));
    envolver(<PlanYAlmacenamiento tenantId="t" />);
    expect(await screen.findByText("12 GB de 50 GB")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("24");
    expect(screen.getAllByText("Estudio Genio disponible")).toHaveLength(4);
    expect(screen.getAllByText(/Esencial US\$500 · Completo US\$1\.500/)).toHaveLength(4);
    expect(screen.getByText("Su plan")).toBeTruthy();
    expect(screen.getByText("1 TB de archivo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Conocer el Estudio Genio" }).getAttribute("href")).toBe("/legal/estudio-genio");
  });

  it("al 80 % avisa y lleno lo dice", async () => {
    jest.spyOn(api, "leerEspacio").mockResolvedValue(espacio(50 * GB, "lleno"));
    envolver(<PlanYAlmacenamiento tenantId="t" />);
    expect(await screen.findByText(/está lleno/)).toBeTruthy();
  });

  it("comprar con tarjeta lleva a Stripe con la ampliación elegida", async () => {
    jest.spyOn(api, "leerEspacio").mockResolvedValue(espacio(1 * GB, "ok"));
    const compra = jest.spyOn(api, "comprarAmpliacion").mockResolvedValue({ url_pago: "https://checkout.stripe.com/x" } as never);
    const ir = jest.spyOn(navegadorArchivo, "ir").mockImplementation(() => {});
    jest.spyOn(navegadorArchivo, "url").mockReturnValue("https://dashboard.nadakki.com/legal/config");
    envolver(<PlanYAlmacenamiento tenantId="t" />);
    fireEvent.click(await screen.findByLabelText(/\+250 GB/));
    fireEvent.click(screen.getByRole("button", { name: "Ir a pagar" }));
    await waitFor(() => expect(ir).toHaveBeenCalledWith("https://checkout.stripe.com/x"));
    expect(compra).toHaveBeenCalledWith("t", { paquete: "250gb", metodo: "stripe", url_retorno: "https://dashboard.nadakki.com/legal/config" });
  });

  it("sin datos del backend el medidor de Mi despacho no pinta nada", async () => {
    jest.spyOn(api, "leerEspacio").mockRejectedValue(new Error("404"));
    const { container } = envolver(<MedidorArchivo tenantId="t" />);
    await waitFor(() => expect(api.leerEspacio).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("una respuesta sin la forma esperada no pinta el medidor (axe: nada de aria-valuenow=NaN)", async () => {
    const fetchMod = await import("@/lib/api/fetch-client");
    jest.spyOn(fetchMod, "apiFetch").mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) } as unknown as Response);
    await expect(api.leerEspacio("t")).rejects.toThrow();
  });

  it("tamaños en español", () => {
    expect(api.tamano(381 * 1024)).toBe("381 KB");
    expect(api.tamano(1.5 * GB)).toBe("1,5 GB");
    expect(api.gb(1024)).toBe("1 TB");
  });
});
