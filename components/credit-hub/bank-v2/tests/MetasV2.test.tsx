import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MetasDelMes } from "@/components/credit-hub/bank-v2/mesa/MetasDelMes";
import { comparacionMeta, diasRestantes, estadoMeta, objetivoMeta, ritmoMeta } from "@/components/credit-hub/bank-v2/mesa/metas";

/** AUDIT-COWORK 6/9: dias restantes, meta con comparador, comparacion y ritmo. */
const F = { locale: "es-DO", currency: "DOP" };
const AHORA = new Date(2026, 9, 7, 10, 0); // 7 de octubre de 2026
const tasa = { metric_key: "approval_rate", label_es: "Tasa de aprobación", unit: "ratio", current_value: 0.62, target_value: 0.8 };
const horas = { metric_key: "avg_response_hours", label_es: "Tiempo de respuesta", unit: "hours", current_value: 4.5, target_value: 6 };
const conteo = { metric_key: "approved_count", label_es: "Solicitudes aprobadas", unit: "count", current_value: 12, target_value: 40 };
const n = (s: string | null) => s?.replace(/ /g, " ") ?? null;

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/credit-hub/api/goalsClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/goalsClient"),
  currentGoalsPeriod: () => "2026-10",
}));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async () => ({ period: "2026-10", goals: [tasa, horas, conteo] })),
}));

describe("Metas del mes (bank-v2)", () => {
  it("dias restantes solo para el mes en curso", () => {
    expect(diasRestantes("2026-10", AHORA)).toBe(24);
    expect(diasRestantes("2026-09", AHORA)).toBeNull();
    expect(diasRestantes("2026-10", new Date(2026, 9, 31))).toBe(0);
  });

  it("meta con su sentido y comparacion en llano", () => {
    expect(n(objetivoMeta(tasa, F))).toBe("≥ 80 %");
    expect(n(objetivoMeta(horas, F))).toBe("≤ 6 h");
    expect(comparacionMeta(tasa, F)).toBe("18 puntos por debajo de la meta");
    expect(n(comparacionMeta(horas, F))).toBe("1.5 h por debajo del máximo");
    expect(n(comparacionMeta(conteo, F))).toBe("30 % de la meta");
    expect(comparacionMeta({ ...conteo, target_value: 0 }, F)).toBeNull();
  });

  it("ritmo solo en acumulables del mes en curso", () => {
    expect(n(ritmoMeta(conteo, "2026-10", AHORA, F))).toBe("Ritmo esperado a hoy: 22.6 %");
    expect(ritmoMeta(tasa, "2026-10", AHORA, F)).toBeNull();
    expect(ritmoMeta(conteo, "2026-09", AHORA, F)).toBeNull();
  });

  it("acumulables del mes en curso: estado contra el ritmo; el resto, como el panel actual", () => {
    expect(estadoMeta(conteo, "2026-10", AHORA, "atrasado")).toBe("en camino");
    expect(estadoMeta({ ...conteo, current_value: 5 }, "2026-10", AHORA, "atrasado")).toBe("atrasado");
    expect(estadoMeta({ ...conteo, current_value: 40 }, "2026-10", AHORA, "en camino")).toBe("cumplido");
    expect(estadoMeta(tasa, "2026-10", AHORA, "en camino")).toBe("en camino");
    expect(estadoMeta(conteo, "2026-09", AHORA, "atrasado")).toBe("atrasado");
  });

  it("pinta dias restantes, comparador, comparacion y ritmo", async () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MetasDelMes formato={F} ahora={AHORA} />
      </QueryClientProvider>,
    );
    expect(await screen.findAllByTestId("meta-del-mes")).toHaveLength(3);
    const texto = n(container.textContent ?? "")!;
    expect(texto).toContain("quedan 24 días");
    expect(texto).toContain("62 % · meta ≥ 80 %");
    expect(texto).toContain("4.5 h · meta ≤ 6 h");
    expect(texto).toContain("En camino · 30 % de la meta");
    expect(texto).toContain("18 puntos por debajo de la meta");
    expect(texto).toContain("Ritmo esperado a hoy: 22.6 %");
  });
});
