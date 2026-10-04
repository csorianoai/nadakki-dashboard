/**
 * La barra lateral del dealer se CONTRAE y se EXPANDE (pedido de Cesar).
 *
 * Las cuatro reglas del pedido, que son las que se pueden romper sin que nada
 * se caiga:
 *
 *  1. UN boton alterna los dos anchos y lo dice: `aria-label` con la accion y
 *     `aria-expanded` con el estado de la barra.
 *  2. En estrecha queda el icono y el nombre pasa al TOOLTIP — pero el nombre
 *     ACCESIBLE no desaparece: sigue en el texto, en `sr-only`. Un menu de
 *     iconos sin nombre accesible no se puede usar con lector de pantalla.
 *  3. La preferencia DURA LA SESION y vive en React: contraer, navegar, seguir
 *     estrecha. Y no se escribe en Local Storage, a proposito.
 *  4. NADA SE SUPERPONE AL CONTENIDO: en escritorio la barra va en el flujo, y
 *     el panel superpuesto es el otro eje, el de celular (`mobileOpen`).
 *
 * El shell se monta de verdad, sin simular el estado: la regla 3 es justamente
 * de quien lo guarda, y con el `useState` dentro del sidebar el caso de navegar
 * se pone rojo.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Car, ReceiptText, Wallet } from "lucide-react";
import type { ComponentProps } from "react";

import { DealerShell } from "@/components/dealer-management/shell/DealerShell";
import { DealerSidebar } from "@/components/dealer-management/shell/DealerSidebar";
import type { DealerNavGroup } from "@/components/dealer-management/shell/dealer-nav";

let pathname = "/autos/dealer";

// `DealerShell` monta el AuthProvider de `@/lib/auth-context`: se corta aqui la
// cadena de imports antes de `lib/config/backend-url`, que lanza sin backend.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal" } }),
}));

/** El acceso es red: aqui se concede todo. El filtrado por entitlements es
 *  contrato de DealerSidebarTopbar.test.tsx; esto mide los dos anchos. */
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => ({
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: { results: Object.fromEntries(keys.map((k) => [k, { allowed: true }])) },
  }),
}));

jest.mock("@/components/dealer/CoreNavigation", () => ({
  isAccessQueryFailClosed: () => false,
}));

/** El binding del dealer no es lo que se mide: se da por resuelto para que el
 *  shell pinte los hijos en vez del "Verificando". */
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => ({
    status: "ready",
    context: { tenantId: "tenant-mapaal", dealerId: "dealer-mapaal" },
  }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  DEALER_CONTEXT_PATH: "/api/v1/autos/dealers/me/context",
  syncDealerContextFromBackend: async () => ({ estado: "sincronizado" }),
}));

const GRUPOS: DealerNavGroup[] = [
  {
    id: "operacion",
    label: "Operacion",
    items: [
      { href: "/autos/dealer", label: "Inicio", icon: Car, capability: null },
      {
        href: "/autos/dealer/inventario",
        label: "Inventario",
        icon: Wallet,
        capability: "autos.inventory.list",
      },
    ],
  },
  {
    id: "finanzas",
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

function Barra(props: Partial<ComponentProps<typeof DealerSidebar>>) {
  return (
    <DealerSidebar
      groups={GRUPOS}
      loading={false}
      mobileOpen={false}
      onClose={() => {}}
      collapsed={false}
      onToggleCollapsed={() => {}}
      {...props}
    />
  );
}

function sidebar(props: Partial<ComponentProps<typeof DealerSidebar>> = {}) {
  return render(<Barra {...props} />);
}

/**
 * El shell completo, con su estado real de contraccion.
 *
 * `repintar()` modela una navegacion del App Router: el layout --y con el, el
 * shell-- NO se desmonta, se vuelve a pintar con el pathname nuevo. Por eso se
 * reutiliza el mismo arbol y el mismo QueryClient: montarlo otra vez perderia
 * el estado por construccion y el caso no mediria nada.
 */
function montarShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  /* Un elemento NUEVO en cada pintada: React descarta el re-render si se le
     pasa el mismo objeto, y el caso de navegar se quedaria sin repintado. */
  const arbol = () => (
    <QueryClientProvider client={client}>
      <DealerShell>
        <p>contenido del dealer</p>
      </DealerShell>
    </QueryClientProvider>
  );
  const { rerender } = render(arbol());
  return { repintar: () => rerender(arbol()) };
}

const boton = () => screen.getByTestId("dealer-sidebar-toggle");
const barra = () => screen.getByTestId("dealer-sidebar");

beforeEach(() => {
  pathname = "/autos/dealer";
  window.localStorage.clear();
});

describe("el boton que alterna los dos anchos", () => {
  it("expandida dice que se contrae, y declara la barra abierta", () => {
    sidebar({ collapsed: false });

    expect(boton()).toHaveAttribute("aria-label", "Contraer menú");
    expect(boton()).toHaveAttribute("aria-expanded", "true");
    expect(barra()).toHaveAttribute("data-collapsed", "false");
  });

  it("estrecha dice que se expande, y declara la barra cerrada", () => {
    sidebar({ collapsed: true });

    expect(boton()).toHaveAttribute("aria-label", "Expandir menú");
    expect(boton()).toHaveAttribute("aria-expanded", "false");
    expect(barra()).toHaveAttribute("data-collapsed", "true");
  });

  it("gobierna el <nav> del menu, y lo dice con aria-controls", () => {
    sidebar({ collapsed: false });

    const nav = screen.getByRole("navigation", { name: "Navegación del dealer" });
    expect(nav.id).toBeTruthy();
    expect(boton()).toHaveAttribute("aria-controls", nav.id);
  });

  it("es un control de escritorio: en celular el eje es el panel superpuesto", () => {
    sidebar({ collapsed: false });

    // La X de cerrar es `lg:hidden`; este boton es su contrario.
    expect(boton().parentElement?.className).toContain("hidden");
    expect(boton().parentElement?.className).toContain("lg:block");
  });
});

describe("barra estrecha: solo iconos, el nombre en el tooltip", () => {
  it("cada modulo conserva su nombre accesible y gana tooltip", () => {
    sidebar({ collapsed: true });

    const inventario = screen.getByRole("link", { name: "Inventario" });
    expect(inventario).toHaveAttribute("title", "Inventario");
    expect(inventario).toHaveAttribute("href", "/autos/dealer/inventario");
  });

  it("el nombre sale del flujo visual, no del arbol de accesibilidad", () => {
    const { rerender } = sidebar({ collapsed: true });
    expect(screen.getByText("Inventario")).toHaveClass("sr-only");

    rerender(<Barra collapsed={false} />);

    // Expandida el texto se ve, y el tooltip sobra: no repite lo que ya se lee.
    expect(screen.getByText("Inventario")).not.toHaveClass("sr-only");
    expect(screen.getByRole("link", { name: "Inventario" })).not.toHaveAttribute("title");
  });

  it("los titulos de grupo no se recortan: desaparecen y los separa una linea", () => {
    const { rerender } = sidebar({ collapsed: false });
    expect(screen.getByRole("heading", { name: "Finanzas" })).toBeInTheDocument();

    rerender(<Barra collapsed />);

    expect(screen.queryByRole("heading", { name: "Finanzas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Operacion" })).not.toBeInTheDocument();
    // Pero los modulos de los dos grupos siguen ahi: se oculta la etiqueta del
    // grupo, no su contenido.
    expect(screen.getByRole("link", { name: "Contabilidad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inventario" })).toBeInTheDocument();
  });

  it("la marca del tenant sigue nombrando el enlace de Inicio", () => {
    sidebar({ collapsed: true });

    expect(screen.getByRole("link", { name: "Mapaal" })).toHaveAttribute(
      "href",
      "/autos/dealer",
    );
  });
});

describe("la preferencia dura la sesion", () => {
  it("contraer, navegar y seguir estrecha", () => {
    const { repintar } = montarShell();
    expect(barra()).toHaveAttribute("data-collapsed", "false");

    fireEvent.click(boton());
    expect(barra()).toHaveAttribute("data-collapsed", "true");

    // Navegacion: se pulsa el modulo, cambia el pathname y el chrome se
    // repinta sin desmontarse.
    fireEvent.click(screen.getByRole("link", { name: "Inventario" }));
    pathname = "/autos/dealer/inventario";
    repintar();

    expect(barra()).toHaveAttribute("data-collapsed", "true");
    // Y el repintado es real, no una afirmacion vacia: el activo ya es otro.
    expect(screen.getByRole("link", { name: "Inventario" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("y volver a expandir devuelve los nombres y los titulos de grupo", () => {
    montarShell();

    fireEvent.click(boton());
    expect(screen.getByText("Inventario")).toHaveClass("sr-only");

    fireEvent.click(boton());

    expect(barra()).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByText("Inventario")).not.toHaveClass("sr-only");
    expect(screen.getByRole("heading", { name: "Finanzas" })).toBeInTheDocument();
  });

  it("no se persiste: alternar no escribe nada en Local Storage", () => {
    montarShell();

    fireEvent.click(boton());
    fireEvent.click(boton());
    fireEvent.click(boton());

    expect(window.localStorage.length).toBe(0);
  });
});

describe("nada se superpone al contenido", () => {
  it("en escritorio la barra va en el flujo: estrecharla da ancho, no tapa", () => {
    sidebar({ collapsed: true });

    // `lg:sticky` + `shrink-0` dentro del flex del shell: el contenido es
    // hermano, no queda debajo. Si alguien convirtiera la barra estrecha en un
    // panel flotante de escritorio, esto se cae.
    expect(barra().className).toContain("lg:sticky");
    expect(barra().className).not.toContain("lg:fixed");
    expect(barra().className).not.toContain("lg:absolute");
  });

  it("contraer no enciende el panel superpuesto ni su fondo oscuro", () => {
    sidebar({ collapsed: true, mobileOpen: false });

    // Dos cosas llevan "Cerrar menú": el fondo oscuro y la X. Con el panel
    // cerrado solo puede quedar la X.
    expect(screen.getAllByLabelText("Cerrar menú")).toHaveLength(1);
  });

  it("el ancho estrecho es solo de escritorio: el panel de celular no se estrecha", () => {
    sidebar({ collapsed: true, mobileOpen: true });

    expect(barra().className).toContain("w-[264px]");
    expect(barra().className).toContain("lg:w-[72px]");
    expect(barra().className).toContain("translate-x-0");
  });

  it("el contenido principal se pinta junto a la barra estrecha, no detras", async () => {
    montarShell();

    fireEvent.click(boton());

    const contenido = await screen.findByText("contenido del dealer");
    // El contenedor del contenido es hermano de la barra, no descendiente.
    expect(barra().contains(contenido)).toBe(false);
  });
});
