/**
 * Contrato de presentacion del sidebar y el topbar del dealer.
 *
 * Lo que se afirma son las reglas que el diseño declara por escrito y que se
 * pueden romper sin que nada se caiga:
 *
 *  1. Cargando NO se pinta un menu falso. El skeleton es `aria-hidden` y no
 *     debe existir ni un solo enlace de navegacion.
 *  2. El sidebar pinta EXACTAMENTE los grupos que recibe. El filtrado por
 *     entitlements lo hace el shell aguas arriba: si un modulo no esta en
 *     `groups`, no aparece en el menu.
 *  3. El item activo se marca con `aria-current="page"` y lo decide el
 *     pathname, no el orden de la lista.
 *  4. El topbar deriva su breadcrumb del pathname via `dealerBreadcrumbFor`.
 *
 * `useDealerManagementBranding` se mockea porque es una query de red; el
 * fallback "Nadakki" mientras no hay marca es parte del contrato
 * (BRANDING-PRELOGIN-01) y se afirma aqui.
 */
import { render, screen } from "@testing-library/react";
import { Car, ReceiptText, Wallet } from "lucide-react";

import { DealerSidebar } from "@/components/dealer-management/shell/DealerSidebar";
import { DealerTopbar } from "@/components/dealer-management/shell/DealerTopbar";
import type { DealerNavGroup } from "@/components/dealer-management/shell/dealer-nav";

let pathname = "/autos/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const brandingMock = jest.fn();
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => brandingMock(),
}));

/** Todos los href pintados. Ojo: el bloque de marca tambien es un <a>. */
function hrefsPintados(): (string | null)[] {
  return screen.getAllByRole("link").map((a) => a.getAttribute("href"));
}

const GRUPOS: DealerNavGroup[] = [
  {
    label: "Operacion",
    items: [
      { href: "/autos/dealer", label: "Inicio", icon: Car, capability: null },
      {
        href: "/autos/dealer/finanzas",
        label: "Finanzas por vehiculo",
        icon: Wallet,
        capability: "autos.inventory.list",
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        href: "/contable",
        label: "Contabilidad",
        icon: ReceiptText,
        capability: "accounting.ledger.entries",
      },
    ],
  },
];

beforeEach(() => {
  pathname = "/autos/dealer";
  brandingMock.mockReturnValue({ data: null });
});

describe("DealerSidebar", () => {
  it("cargando no pinta ningun item de navegacion: skeleton, no un menu falso", () => {
    render(
      <DealerSidebar
        groups={GRUPOS}
        loading
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    // El bloque de marca SI se pinta mientras carga; lo que no puede aparecer
    // es un solo item del menu, ni su etiqueta ni su href.
    expect(screen.queryByText("Contabilidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Finanzas por vehiculo")).not.toBeInTheDocument();
    expect(screen.queryByText("Operacion")).not.toBeInTheDocument();
    expect(hrefsPintados()).not.toContain("/contable");
    expect(hrefsPintados()).not.toContain("/autos/dealer/finanzas");
  });

  it("pinta exactamente los grupos que recibe", () => {
    render(
      <DealerSidebar
        groups={GRUPOS}
        loading={false}
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText("Operacion")).toBeInTheDocument();
    expect(screen.getByText("Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Contabilidad")).toBeInTheDocument();
    expect(hrefsPintados()).toEqual(
      expect.arrayContaining(["/autos/dealer", "/autos/dealer/finanzas", "/contable"]),
    );
  });

  it("un modulo ausente de groups no aparece: el filtrado es aguas arriba", () => {
    render(
      <DealerSidebar
        groups={[GRUPOS[0]]}
        loading={false}
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.queryByText("Contabilidad")).not.toBeInTheDocument();
    expect(hrefsPintados()).not.toContain("/contable");
    expect(hrefsPintados()).toEqual(
      expect.arrayContaining(["/autos/dealer", "/autos/dealer/finanzas"]),
    );
  });

  it("marca el activo segun el pathname, no por posicion", () => {
    pathname = "/autos/dealer/finanzas";
    render(
      <DealerSidebar
        groups={GRUPOS}
        loading={false}
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByRole("link", { name: /Finanzas por vehiculo/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Inicio/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sin marca del tenant cae al fallback Nadakki", () => {
    render(
      <DealerSidebar
        groups={GRUPOS}
        loading={false}
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText("Nadakki")).toBeInTheDocument();
  });

  it("usa el display_name del tenant cuando existe", () => {
    brandingMock.mockReturnValue({ data: { display_name: "Mapaal" } });
    render(
      <DealerSidebar
        groups={GRUPOS}
        loading={false}
        mobileOpen={false}
        onClose={() => {}}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText("Mapaal")).toBeInTheDocument();
    expect(screen.queryByText("Nadakki")).not.toBeInTheDocument();
  });
});

describe("DealerTopbar", () => {
  it("deriva el breadcrumb del pathname", () => {
    pathname = "/autos/dealer/finanzas";
    render(<DealerTopbar canPublish canSeeNotifications onMenuClick={() => {}} onSearchClick={() => {}} />);
    expect(screen.getByText("Finanzas por vehículo")).toBeInTheDocument();
  });

  it("en la raiz del panel no inventa migas de mas", () => {
    pathname = "/autos/dealer";
    render(<DealerTopbar canPublish canSeeNotifications onMenuClick={() => {}} onSearchClick={() => {}} />);
    expect(screen.queryByText("Finanzas por vehículo")).not.toBeInTheDocument();
  });
});
