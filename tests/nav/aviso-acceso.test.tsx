jest.mock("next/navigation", () => ({ usePathname: () => null }));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ allRoles: [{ core_name: "credit", role_key: "bank_analyst" }], isLoading: false }),
}));
import { render, screen } from "@testing-library/react";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";
import { SOLO_SUPERADMIN_DETALLE, SOLO_SUPERADMIN_TITULO } from "@/lib/auth/platform-staff";
import { TOKENS_AVISO_ACCESO } from "@/components/auth/aviso-acceso";
import { DCC_TOKENS, type DccTheme } from "@/lib/dcc/tokens";

describe("PS-11-MODULOS-OPS-B (d)", () => {
  it("(d) el aviso «Acceso no autorizado» usa tokens DCC con contraste >= 4.5:1", () => {
    const lum = (h: string) => {
      const [r, g, b] = (h.replace("#", "").match(/../g) ?? []).map((x) => {
        const c = parseInt(x, 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    for (const theme of ["light", "dark"] as DccTheme[]) {
      for (const texto of [TOKENS_AVISO_ACCESO.titulo, TOKENS_AVISO_ACCESO.detalle]) {
        const [x, y] = [lum(DCC_TOKENS[theme][texto]), lum(DCC_TOKENS[theme][TOKENS_AVISO_ACCESO.fondo])].sort((p, q) => q - p);
        expect((x! + 0.05) / (y! + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("PS-11-MODULOS-OPS-B (d) render", () => {
  it("el componente renderizado pinta titulo, detalle y fondo con los tokens medidos", () => {
    render(<SoloSuperadminDePlataforma>secreto</SoloSuperadminDePlataforma>);
    const caja = screen.getByTestId("solo-superadmin-denegado");
    expect(caja.getAttribute("style")).toContain(TOKENS_AVISO_ACCESO.fondo);
    expect(screen.getByText(SOLO_SUPERADMIN_TITULO).getAttribute("style")).toContain(TOKENS_AVISO_ACCESO.titulo);
    expect(screen.getByText(SOLO_SUPERADMIN_DETALLE).getAttribute("style")).toContain(TOKENS_AVISO_ACCESO.detalle);
    expect(caja.className).not.toMatch(/text-white|text-gray/);
  });
});
