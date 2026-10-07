import { fireEvent, render, screen } from "@testing-library/react";
import { Inbox, LayoutDashboard } from "lucide-react";
import { BuscadorBanco, opcionesBuscador } from "@/components/credit-hub/bank-v2/cabecera/BuscadorBanco";
import { CampanaBanco } from "@/components/credit-hub/bank-v2/cabecera/CampanaBanco";
import type { DccNavGroup } from "@/components/dcc/shell/DccShell";

/** AUDIT-COWORK 8/9: buscador ⌘K y campana en la barra superior del banco v2. */
const GRUPOS: DccNavGroup[] = [
  { label: "Operación", items: [{ id: "mesa", label: "Mesa de decisiones", href: "/b", icon: LayoutDashboard }, { id: "bandeja", label: "Bandeja", href: "/b/solicitudes", icon: Inbox }] },
  { label: "Inteligencia", items: [{ id: "analitica", label: "Analítica", href: "/b/analitica", icon: Inbox }] },
];

let notif: { hidden: boolean; items: Array<{ id?: string; title: string; read?: boolean; application_id?: string }>; unreadCount: number } = { hidden: true, items: [], unreadCount: 0 };
const markAsRead = jest.fn(async () => undefined);
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({ useNotifications: () => ({ ...notif, markAsRead }) }));

describe("Buscador ⌘K", () => {
  it("sin texto: las pantallas; con texto: primero buscar solicitudes en la Bandeja, sin acentos", () => {
    expect(opcionesBuscador(GRUPOS, "", "/b/solicitudes").map((o) => o.id)).toEqual(["mesa", "bandeja", "analitica"]);
    const r = opcionesBuscador(GRUPOS, "analitica", "/b/solicitudes");
    expect(r[0]).toMatchObject({ id: "buscar-solicitudes", href: "/b/solicitudes?q=analitica" });
    expect(r.map((o) => o.id)).toContain("analitica");
    expect(opcionesBuscador(GRUPOS, "María Pérez", "/b/solicitudes")[0].href).toBe("/b/solicitudes?q=Mar%C3%ADa%20P%C3%A9rez");
  });

  it("Ctrl+K abre, Enter va a la Bandeja filtrada; Escape cierra", () => {
    const onIr = jest.fn();
    render(<BuscadorBanco grupos={GRUPOS} hrefBandeja="/b/solicitudes" onIr={onIr} />);
    expect(screen.queryByTestId("banco-buscador-dialogo")).toBeNull();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox");
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "Ana" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onIr).toHaveBeenCalledWith("/b/solicitudes?q=Ana");
    expect(screen.queryByTestId("banco-buscador-dialogo")).toBeNull();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(screen.queryByTestId("banco-buscador-dialogo")).toBeNull();
  });

  it("flechas eligen una pantalla", () => {
    const onIr = jest.fn();
    render(<BuscadorBanco grupos={GRUPOS} hrefBandeja="/b/solicitudes" onIr={onIr} />);
    fireEvent.click(screen.getByTestId("banco-buscador"));
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onIr).toHaveBeenCalledWith("/b/solicitudes");
  });
});

describe("Campana", () => {
  beforeEach(() => markAsRead.mockClear());

  it("apagada (flag o 404/501): no se pinta", () => {
    notif = { hidden: true, items: [], unreadCount: 0 };
    const { container } = render(<CampanaBanco hrefSolicitud={(id) => `/s/${id}`} onIr={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("con avisos: contador, lista y al pulsar marca leida y abre la solicitud", () => {
    notif = { hidden: false, items: [{ id: "n1", title: "Nueva solicitud", read: false, application_id: "a1" }, { title: "Sin id", read: true }], unreadCount: 1 };
    const onIr = jest.fn();
    render(<CampanaBanco hrefSolicitud={(id) => `/s/${id}`} onIr={onIr} />);
    const boton = screen.getByTestId("banco-campana");
    expect(boton).toHaveAccessibleName("Notificaciones: 1 sin leer");
    fireEvent.click(boton);
    fireEvent.click(screen.getByText("Nueva solicitud"));
    expect(markAsRead).toHaveBeenCalledWith("n1");
    expect(onIr).toHaveBeenCalledWith("/s/a1");
  });

  it("sin avisos: lo dice en llano", () => {
    notif = { hidden: false, items: [], unreadCount: 0 };
    render(<CampanaBanco hrefSolicitud={(id) => id} onIr={jest.fn()} />);
    fireEvent.click(screen.getByTestId("banco-campana"));
    expect(screen.getByText("Sin notificaciones nuevas.")).toBeInTheDocument();
  });
});
