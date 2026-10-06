import { existsSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BankApplicationDetailPage from "@/app/(bank)/bank/applications/[id]/page";
import { fetchBankApplicationDetail } from "@/lib/bank-application-detail/fetch-detail";
import { BankApplicationHttpError } from "@/lib/bank-application-detail/errors";

/**
 * P1: los tres enlaces "volver a la bandeja" del detalle viejo apuntaban a
 * /bank/applications/queue, que no existe. Ahora van a la Bandeja real.
 */
const BANDEJA = "/credit-hub/bank/applications";
const push = jest.fn();

jest.mock("@/lib/bank-application-detail/fetch-detail", () => ({ fetchBankApplicationDetail: jest.fn() }));
jest.mock("@/lib/bank-application-detail/claim-application", () => ({
  claimBankApplication: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
}));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "analista", email: "a@b.c", is_active: true, mfa_enabled: false } }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/bank/applications/app-1" }));
jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, href }: { children?: React.ReactNode; href: string }) => React.createElement("a", { href }, children),
  };
});
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn(), message: jest.fn(), info: jest.fn() } }));
jest.mock("react", () => {
  const React = jest.requireActual("react");
  return { ...React, use: (input: unknown) => (input && typeof (input as PromiseLike<unknown>).then === "function" ? { id: "app-1" } : input) };
});

const pagina = () => render(<BankApplicationDetailPage params={Promise.resolve({ id: "app-1" }) as never} />);

describe("detalle viejo: volver a la bandeja", () => {
  beforeEach(() => push.mockClear());

  it("la Bandeja de destino existe como ruta", () => {
    expect(existsSync(join(process.cwd(), "app/(forge)/credit-hub/bank/applications/page.tsx"))).toBe(true);
  });

  it("migas: '← Bandeja' lleva a la Bandeja real", async () => {
    (fetchBankApplicationDetail as jest.Mock).mockResolvedValue({
      application_id: "app-1", queue_status: "pending", borrower_name_masked: "F. *** L", amount: 1000, currency: "DOP",
      dealer: { id: "d1", name: "Dealer" }, borrower: { cedula_masked: "XXX" }, vehicle: { year: 2020, make: "Kia", model: "Rio" },
      scoring: { pti: 10, dti: 30 }, documents: [], stipulations: [], events_count: 0, recent_events: [],
    });
    pagina();
    const migas = await screen.findByRole("navigation", { name: /migas/i });
    expect(migas.querySelector("a")).toHaveAttribute("href", BANDEJA);
  });

  it("no encontrada: 'Ir a la bandeja' lleva a la Bandeja real", async () => {
    (fetchBankApplicationDetail as jest.Mock).mockRejectedValue(new BankApplicationHttpError("no encontrada", 404));
    pagina();
    expect(await screen.findByRole("link", { name: /ir a la bandeja/i })).toHaveAttribute("href", BANDEJA);
  });

  it("acceso denegado: 'Volver a la bandeja' navega a la Bandeja real", async () => {
    (fetchBankApplicationDetail as jest.Mock).mockRejectedValue(new BankApplicationHttpError("prohibido", 403));
    pagina();
    fireEvent.click(await screen.findByRole("button", { name: /volver a la bandeja/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(BANDEJA));
  });
});
