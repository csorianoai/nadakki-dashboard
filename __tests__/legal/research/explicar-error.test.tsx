import { renderToStaticMarkup } from "react-dom/server";
import { explicarErrorInvestigacion } from "@/lib/legal/research/explicar-error";
import { ResearchComposer } from "@/components/legal/research/papel-blanco/ResearchComposer";
import { ResearchTopBar } from "@/components/legal/research/papel-blanco/ResearchTopBar";

describe("Investigación: errores explicados y caja de consulta libre", () => {
  it("explica que el espacio no es un despacho y qué hacer", () => {
    const t = explicarErrorInvestigacion("sin unidad organizativa resoluble");
    expect(t).toContain("no está configurado como despacho jurídico");
    expect(t).toContain("Tenant");
  });

  it("deja pasar los demás errores tal cual", () => {
    expect(explicarErrorInvestigacion("Tiempo agotado")).toBe("Tiempo agotado");
  });

  it("la caja invita a escribir libre y no muestra un candado", () => {
    const html = renderToStaticMarkup(
      <ResearchComposer value="" onChange={() => {}} onSubmit={() => {}} maxChars={4000} />,
    );
    expect(html).toContain("Escribe aquí lo que quieres investigar");
    expect(html).not.toContain("lucide-lock");
    expect(html).toContain("con tus palabras");
  });

  it("el asistente general ya no se llama Laboral senior", () => {
    const html = renderToStaticMarkup(
      <ResearchTopBar agentId="chat_asesor_legal" onAgentChange={() => {}} recentCount={0} onOpenRecent={() => {}} />,
    );
    expect(html).toContain("Asesor legal general");
    expect(html).not.toContain("Laboral senior");
  });
});
