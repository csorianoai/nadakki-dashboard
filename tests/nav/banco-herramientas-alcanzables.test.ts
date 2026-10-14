import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const base = "app/(forge)/credit-hub";

describe("Herramientas del expediente bancario", () => {
  it("evita la ruta histórica que redirige de vuelta al expediente V2", () => {
    const detail = read(`${base}/bank-v2/solicitudes/[applicationId]/page.tsx`);
    expect(detail).toContain('hrefVistaActual={`/credit-hub/bank-v2/solicitudes/${encodeURIComponent(applicationId)}/herramientas`}');
    expect(detail).not.toContain('/credit-hub/bank/applications/');
    const config = read("next.config.js");
    expect(config).toContain('/credit-hub/bank/applications/:applicationId');
    expect(config).not.toMatch(/source:\s*["']\/credit-hub\/bank-v2\/solicitudes\//);
  });

  it("reutiliza las operaciones existentes sin añadir otra implementación", () => {
    const page = read(`${base}/bank-v2/solicitudes/[applicationId]/herramientas/page.tsx`);
    expect(page).toContain('export { default } from "@/app/(forge)/credit-hub/bank/applications/[applicationId]/page"');
    expect(page).not.toContain("fetch(");
  });

  it("conserva la protección bancaria y por tenant del shell heredado", () => {
    const shell = read(`${base}/bank-v2/BancoV2Shell.tsx`);
    expect(shell).toContain("CHTenantGuard");
    expect(shell).toMatch(/CHPortalAccessGuard[^>]*portal="bank"/);
  });
});
