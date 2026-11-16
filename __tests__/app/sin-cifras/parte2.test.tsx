/** D5-SIN-CIFRAS-FALSAS parte 2: ninguna cifra ni nombre fijo en social y analytics. */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));

const PANTALLAS: Array<[string, () => any, string[], string, string]> = [
  ["social/analytics", () => require("@/app/social/analytics/page").default, ["41.2K", "125K", "4.8%", "8.5K", "12.5K", "Hace 5 min"], "Social Analytics", "analiticas sociales"],
  ["social/inbox", () => require("@/app/social/inbox/page").default, ["@maria_lopez", "@tech_carlos", "Ana Martinez", "@startup_mx", "sin leer"], "Social Inbox", "mensajes"],
  ["social/monitoring", () => require("@/app/social/monitoring/page").default, ["479", "89%", "fintech mexico", "credito digital", "234"], "Social Monitoring", "monitoreo"],
  ["social/scheduler", () => require("@/app/social/scheduler/page").default, ["Nuevo lanzamiento", "Tips de productividad", "2025-01-06", "4 posts"], "Programador de Posts", "posts programados"],
  ["social/feeds", () => require("@/app/social/feeds/page").default, ["TechCrunch", "HubSpot Blog", "marketingland.com", "Hace 5 min"], "Feeds RSS", "feeds"],
  ["analytics", () => require("@/app/analytics/page").default, ["Vistas Disponibles", "Vista Canonical", "Workspace Root"], "Analytics Hub", ""],
  ["analytics/agents", () => require("@/app/analytics/agents/page").default, ["1234", "98.5%", "99.1%", "4 Agentes", "Anomaly Detector"], "Agentes de Analytics", "agentes"],
  ["analytics/campaigns", () => require("@/app/analytics/campaigns/page").default, ["Black Friday", "1.2M", "45K", "320%", "Newsletter Q4"], "Analytics de Campanas", "campanas"],
  ["analytics/roi", () => require("@/app/analytics/roi/page").default, ["$125K", "$32K", "290%", "+45%"], "ROI Analysis", "retorno de inversion"],
  ["analytics/conversions", () => require("@/app/analytics/conversions/page").default, ["12.5K", "3.8%", "$45", "+15%"], "Conversion Analytics", "conversiones"],
  ["analytics/reports", () => require("@/app/analytics/reports/page").default, ["Reporte Mensual", "Performance Q4", "ROI Campanas 2024", "Semanal #52"], "Reportes", "reportes"],
];

describe.each(PANTALLAS)("%s", (_n, load, prohibidos, titulo) => {
  it("no pinta cifras ni nombres fijos y conserva el titulo", () => {
    const Page = load();
    const { container } = render(<Page />);
    const texto = container.textContent || "";
    for (const p of prohibidos) expect(texto).not.toContain(p);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(titulo);
  });
});

describe("pantallas sin backend", () => {
  it.each(PANTALLAS.filter(([n]) => n !== "analytics"))("%s muestra el estado vacio honesto", (_n, load, _p, _t, cosa) => {
    const Page = load();
    render(<Page />);
    expect(screen.getByTestId("estado-vacio").textContent).toBe(`Aun no hay datos de ${cosa} en tu cuenta`);
  });
});
