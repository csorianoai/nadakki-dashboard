import { readFileSync } from "fs";
import { join } from "path";

/** Literal ActorRole de services/legal/expedientes/schemas_expedientes.py (nadakki-ai-suite). */
const BACKEND = new Set([
  "cliente", "abogado_titular", "abogado_asistente",
  "contraparte", "abogado_contraparte", "tribunal",
  "alguacil", "testigo", "perito", "ministerio_publico",
  "juez", "fiscal", "querellante", "imputado", "otro",
]);

describe("Wizard de nuevo expediente: roles que el backend acepta", () => {
  const src = readFileSync(join(process.cwd(), "components/legal/cases/CaseCreateWizard.tsx"), "utf8");
  const bloque = src.slice(src.indexOf("const ROLE_OPTIONS = ["), src.indexOf("] as const;"));
  const roles = [...bloque.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);

  it("ofrece roles y todos existen en el backend (si no, 422 y no se crea)", () => {
    expect(roles.length).toBeGreaterThan(5);
    expect(roles.filter((r) => !BACKEND.has(r))).toEqual([]);
  });

  it("cada rol ofrecido tiene etiqueta en español", () => {
    const msgs = JSON.parse(readFileSync(join(process.cwd(), "messages/es/legal-cases.json"), "utf8"));
    const etiquetas = msgs.wizard.roles as Record<string, string>;
    expect(roles.filter((r) => !etiquetas[r])).toEqual([]);
  });
});
