/** Backend chat_asesor_legal expects { rol, texto } turns (see nadakki-ai-suite llm_prompt_builder). */
export type LegalChatHistorialTurn = {
  rol: "usuario" | "asistente";
  texto: string;
};

const MAX_HISTORIAL_TURNS = 10;

type ChatTurn = { role: "user" | "assistant"; content: string };

/** Map UI messages to backend historial (prior turns only — current question goes in mensaje/consulta). */
export function buildChatHistorialFromMessages(messages: ChatTurn[]): LegalChatHistorialTurn[] {
  return messages.slice(-MAX_HISTORIAL_TURNS).map((m) => ({
    rol: m.role === "user" ? "usuario" : "asistente",
    texto: m.content,
  }));
}
