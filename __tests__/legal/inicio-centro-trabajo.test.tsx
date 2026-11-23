/**
 * Legal OS — corrección de desviación (César, 22-nov): Inicio como centro de trabajo.
 * Datos: solo lo que dan las APIs reales (expedientes, plazos próximos, cola de revisión).
 */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { filasDeTrabajo, plazoMasUrgente, rutaContinuar } from "@/lib/legal/home/trabajo-expedientes";
import { CaseWorkTable } from "@/components/legal/cases/CaseWorkTable";
import { accionesRapidas, ACCIONES_PREFERIDAS, MAX_ACCIONES } from "@/components/legal/home/QuickAiActions";
import { mismaSeccion } from "@/components/legal/TaskLauncher";
import { nombreInstitucion } from "@/components/legal/LegalHomeContent";
import { menuVisible, modulosVisibles } from "@/lib/modulos/registro";
import { MODULOS } from "@/lib/modulos/registro";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import type { LegalTask } from "@/lib/legal/task-types";
import type { ValidationQueueItem } from "@/lib/legal/validation-queue-api";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));

const caso = (o: Partial<LegalCase>): LegalCase => ({
  case_id: "c", case_number_internal: "N", case_type: "defensa_civil_cobro_pesos", legal_jurisdiction: "do", state: "ACTIVE",
  title: "Caso", practice_area_tags: [], priority: "normal", client_roles: [], related_case_ids: [],
  has_expired_critical_deadline_at_ingestion: false, actors: [], documents: [], deadlines: [], strategies: [],
  open_issues_count: 0, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-20T00:00:00Z", ...o,
});
const item = (case_id: string): ValidationQueueItem => ({
  queue_item_id: `q-${case_id}-${Math.random()}`, case_id, document_id: "d", priority: "normal", status: "pending",
  sla_deadline: null, sla_breached: false, assigned_to: null, created_at: null,
});

describe("unión expedientes + plazos + cola", () => {
  const casos = [
    caso({ case_id: "a", title: "Sin plazo", updated_at: "2026-11-22T00:00:00Z" }),
    caso({ case_id: "b", title: "Plazo lejano" }),
    caso({ case_id: "c", title: "Vencido" }),
    caso({ case_id: "z", title: "Archivado", state: "ARCHIVED" }),
  ];
  const plazos = [
    { case_id: "b", effective_deadline_date: "2026-12-10", is_peremptory: false, catalog_validated: true },
    { case_id: "b", effective_deadline_date: "2026-11-28", is_peremptory: true, catalog_validated: null },
    { case_id: "c", effective_deadline_date: "2026-11-01", is_peremptory: false, overdue: true },
  ];

  it("toma el plazo más urgente: vencido primero, luego la fecha más cercana", () => {
    const m = plazoMasUrgente(plazos);
    expect(m.get("b")).toEqual({ fecha: "2026-11-28", perentorio: true, vencido: false, verificado: false });
    expect(m.get("c")?.vencido).toBe(true);
  });

  it("ordena vencidos, luego por fecha, luego por actualización; oculta cerrados", () => {
    const f = filasDeTrabajo(casos, plazos, [item("b"), item("b")]);
    expect(f.map((x) => x.caso.case_id)).toEqual(["c", "b", "a"]);
    expect(f.find((x) => x.caso.case_id === "b")?.revisionesPendientes).toBe(2);
    expect(f.find((x) => x.caso.case_id === "a")?.revisionesPendientes).toBe(0);
  });

  it("sin cola (sin permiso) el pendiente es null, nunca 0; sin plazos, plazo null", () => {
    const f = filasDeTrabajo(casos, null, null);
    expect(f.every((x) => x.revisionesPendientes === null && x.plazo === null)).toBe(true);
  });

  it("Continuar lleva a los plazos si hay uno; si no, al expediente", () => {
    const [c, , a] = filasDeTrabajo(casos, plazos, null);
    expect(rutaContinuar(c!)).toBe("/legal/cases/c/deadlines");
    expect(rutaContinuar(a!)).toBe("/legal/cases/a");
  });

  it("sin plazo pero con documentos por revisar, Continuar abre Documentos", () => {
    const [f] = filasDeTrabajo([caso({ case_id: "x" })], [], [item("x")]);
    expect(rutaContinuar(f!)).toBe("/legal/cases/x/documents");
  });
});

describe("tabla centro de trabajo", () => {
  it("muestra plazo, regla verificada o por verificar, pendiente y Continuar", () => {
    const filas = filasDeTrabajo([caso({ case_id: "b", title: "Cobro QA" })],
      [{ case_id: "b", effective_deadline_date: "2026-11-28", is_peremptory: true, catalog_validated: true }], [item("b")]);
    render(<CaseWorkTable filas={filas} plazosDisponibles revisionesDisponibles titulo="T" />);
    const fila = screen.getByRole("row", { name: /Cobro QA/ });
    expect(within(fila).getByText(/perentorio/)).toBeInTheDocument();
    expect(within(fila).getByText("Regla verificada")).toBeInTheDocument();
    expect(within(fila).getByText("1 documento por revisar")).toBeInTheDocument();
    expect(within(fila).getByRole("link", { name: /Continuar con Cobro QA/ })).toHaveAttribute("href", "/legal/cases/b/deadlines");
    // móvil: la tarjeta también lleva plazo y Continuar sin desplazamiento horizontal
    const tarjetas = screen.getAllByRole("list", { name: "T" })[0]!;
    expect(within(tarjetas).getByRole("link", { name: /Continuar con Cobro QA/ })).toHaveAttribute("href", "/legal/cases/b/deadlines");
  });

  it("sin datos de plazos ni permiso de cola: «—», sin inventar ceros", () => {
    const filas = filasDeTrabajo([caso({ case_id: "a", title: "X" })], null, null);
    render(<CaseWorkTable filas={filas} plazosDisponibles={false} revisionesDisponibles={false} titulo="T" />);
    // tabla (escritorio) + tarjeta (móvil): «—» en plazo y pendiente de la tabla y en el plazo de la tarjeta
    expect(screen.getAllByText("—").length).toBe(3);
    expect(screen.queryByText(/Nada en revisión/)).toBeNull();
  });
});

describe("acciones rápidas de IA", () => {
  const t = (task_id: string, section_es = "Contratos") => ({ task_id, section_es, display_name_es: task_id, description_es: "" }) as unknown as LegalTask;
  const todas = ["review_contract", "detect_risk_clauses", "respond_to_lawsuit", "calculate_procedural_deadline", "verify_aml_kyc", "research_jurisprudence", "compare_versions"].map((id) => t(id));

  it("como máximo 5, las preferidas primero y solo las habilitadas", () => {
    const r = accionesRapidas(todas, (x) => x.task_id !== "verify_aml_kyc");
    expect(r.length).toBeLessThanOrEqual(MAX_ACCIONES);
    expect(r.map((x) => x.task_id).slice(0, 4)).toEqual(ACCIONES_PREFERIDAS.filter((i) => i !== "verify_aml_kyc"));
    expect(r.map((x) => x.task_id)).not.toContain("verify_aml_kyc");
  });

  it("el catálogo agrupa «Investigacion» (sin tilde, como lo envía el backend)", () => {
    expect(mismaSeccion("Investigacion", "Investigación")).toBe(true);
    expect(mismaSeccion("Contratos", "Litigios")).toBe(false);
  });
});

describe("institución y navegación", () => {
  it("usa el nombre del tenant de la sesión; «—» guardado no cuenta", () => {
    expect(nombreInstitucion("QA Legal Audit", "—")).toBe("QA Legal Audit");
    expect(nombreInstitucion(null, "—")).toBeNull();
    expect(nombreInstitucion(undefined, "Banco X")).toBe("Banco X");
  });

  it("menú de Legal en dos bloques con título fijo (Espacio jurídico / Herramientas) y sin pantalla de grupo", () => {
    const legal = MODULOS.find((m) => m.id === "legal")!;
    expect(legal.menu.map((g) => g.label)).toEqual(["Espacio jurídico", "Herramientas"]);
    expect(legal.menu[1]!.items.map((i) => i.href)).toEqual(["/legal/contracts", "/legal/research", "/legal/library", "/legal/audit", "/legal/config"]);
    expect(legal.sinPantallaGrupo).toBe(true);
  });

  it("Legal no pinta barra de pestañas y su menú lateral conserva todas las URLs y añade el Asistente IA", () => {
    const legal = MODULOS.find((m) => m.id === "legal")!;
    expect(legal.sinPestanas).toBe(true);
    const u = { roles: [{ role_key: "tenant_admin", core_name: "legal" }], subscribedCores: ["legal"] } as unknown as Parameters<typeof modulosVisibles>[0];
    const hrefs = menuVisible(legal, u).flatMap((g) => g.items.map((i) => i.href));
    for (const h of ["/legal", "/legal/cases", "/legal/cases/new", "/legal/audiencias", "/legal/asistente", "/legal/contracts", "/legal/research", "/legal/library", "/legal/audit", "/legal/config"]) {
      expect(hrefs).toContain(h);
    }
  });
});

describe("expediente: plazos legibles y migas en español", () => {
  it("el plazo muestra el acto, no el código interno, y los días en singular", () => {
    const { CaseDeadlinesPanel, restantes } = jest.requireActual("@/components/legal/cases/CaseDeadlinesPanel");
    expect(restantes(1, "Vencido")).toBe("1 día restante");
    expect(restantes(0, "Vencido")).toBe("vence hoy");
    expect(restantes(-2, "Vencido")).toBe("Vencido");
    expect(typeof CaseDeadlinesPanel).toBe("function");
  });

  it("las pantallas internas del expediente tienen miga en español", () => {
    const { migasDe } = jest.requireActual("@/lib/migas");
    expect(migasDe("/legal/cases/c1/deadlines").map((m: { label: string }) => m.label)).toContain("Plazos");
    expect(migasDe("/legal/cases/c1/snapshots").map((m: { label: string }) => m.label)).toContain("Versiones");
  });
});
