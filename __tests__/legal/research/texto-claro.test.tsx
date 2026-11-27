import { render } from "@testing-library/react";
import { textoClaro } from "@/lib/legal/research/texto-claro";
import { ResearchComposer } from "@/components/legal/research/papel-blanco/ResearchComposer";
import { ResearchTopBar } from "@/components/legal/research/papel-blanco/ResearchTopBar";
import { tamano } from "@/lib/legal/archivo-api";

describe("Investigación: texto legible sobre la barra oscura", () => {
  it("el estilo en línea va con !important para ganarle al tema claro", () => {
    const el = document.createElement("textarea");
    textoClaro(el);
    expect(el.style.getPropertyValue("color")).toBe("rgb(238, 242, 248)");
    expect(el.style.getPropertyPriority("color")).toBe("important");
    expect(el.style.getPropertyPriority("-webkit-text-fill-color")).toBe("important");
  });

  it("la caja de consulta y el selector de agente lo aplican", () => {
    const { container } = render(
      <>
        <ResearchComposer value="" onChange={() => {}} onSubmit={() => {}} maxChars={4000} />
        <ResearchTopBar agentId="chat_asesor_legal" onAgentChange={() => {}} recentCount={0} onOpenRecent={() => {}} />
      </>,
    );
    const t = container.querySelector("textarea")!;
    const s = container.querySelector("select")!;
    expect(t.style.getPropertyPriority("color")).toBe("important");
    expect(s.style.getPropertyPriority("color")).toBe("important");
    expect(s.querySelector("option")!.style.getPropertyValue("color")).toBe("rgb(23, 35, 58)");
  });

  it("tamaños redondos sin decimal de más", () => {
    expect(tamano(1024 ** 4)).toBe("1 TB");
    expect(tamano(1.5 * 1024 ** 3)).toBe("1,5 GB");
  });
});
