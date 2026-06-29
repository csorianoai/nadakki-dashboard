import { buildChatHistorialFromMessages } from "@/lib/legal/build-chat-historial";

describe("buildChatHistorialFromMessages", () => {
  it("maps user/assistant roles to backend rol keys", () => {
    expect(
      buildChatHistorialFromMessages([
        { role: "user", content: "¿Qué es la Ley 155-17?" },
        { role: "assistant", content: "Regula AML/KYC en RD." },
      ]),
    ).toEqual([
      { rol: "usuario", texto: "¿Qué es la Ley 155-17?" },
      { rol: "asistente", texto: "Regula AML/KYC en RD." },
    ]);
  });

  it("keeps only the last 10 turns", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      role: "user" as const,
      content: `msg-${i}`,
    }));
    const out = buildChatHistorialFromMessages(many);
    expect(out).toHaveLength(10);
    expect(out[0].texto).toBe("msg-2");
    expect(out[9].texto).toBe("msg-11");
  });
});
