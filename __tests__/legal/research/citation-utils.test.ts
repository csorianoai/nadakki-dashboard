import { buildCopyPayload, citationDomId, formatArticleLabel } from "@/lib/legal/research/citation-utils";

describe("citation-utils", () => {
  it("formatArticleLabel avoids Art. Art. duplication", () => {
    expect(formatArticleLabel("80")).toBe("Art. 80");
    expect(formatArticleLabel("Art. 80")).toBe("Art. 80");
    expect(formatArticleLabel("art. 12")).toBe("Art. 12");
  });

  it("citationDomId sanitizes source id", () => {
    expect(citationDomId("ley:80/foo")).toBe("cite-ley_80_foo");
    expect(citationDomId("CT-RD-0080", "req-abc")).toBe("cite-req-abc-CT-RD-0080");
  });

  it("buildCopyPayload includes citations and request_id", () => {
    const text = buildCopyPayload("Respuesta", {
      agent_id: "chat_asesor_legal",
      tenant_id: "t1",
      status: "success",
      request_id: "req-1",
      respuesta: "Respuesta",
      requiere_revision_abogado: true,
      citations: [
        {
          source_id: "src-1",
          law_name: "Ley 16-92",
          article: "80",
          layer: "capa_1",
          quote_or_summary: "Texto",
        },
      ],
    });
    expect(text).toContain("Ley 16-92");
    expect(text).toContain("Art. 80");
    expect(text).toContain("request_id: req-1");
  });
});
