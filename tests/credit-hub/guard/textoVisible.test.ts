import fs from "fs";
import path from "path";
import { archivosDelArbol, escanearFuente } from "./textoVisibleGuard";

const BASE = path.resolve(__dirname, "../../..");

describe("DB-CODEX-23: sin notas de desarrollo en el texto visible del Credit Hub", () => {
  it("el arbol del Credit Hub tiene 0 resultados", () => {
    const archivos = archivosDelArbol(BASE);
    expect(archivos.length).toBeGreaterThan(50);
    const malos = archivos.flatMap((f) => escanearFuente(fs.readFileSync(path.join(BASE, f), "utf8"), f).map((h) => `${f}:${h.linea} ${h.texto}`));
    expect(malos).toEqual([]);
  });

  it.each([
    ["(MVP) en texto", `export const A = () => <p>Se guarda en la sesión (MVP).</p>;`],
    ["Placeholder en texto", `export const A = () => <p>Placeholder — endpoint</p>;`],
    ["available: false en un literal hijo", `export const A = () => <p>{"kpis/x devolvió available: false"}</p>;`],
    ["ruta /api/ en prop detalle", `export const A = () => <E detalle="falla /api/v2/credit/kpis" />;`],
    ["TODO en prop title", `export const A = () => <E title={"TODO revisar"} />;`],
    ["mock en prop description", `export const A = () => <E description={x ? "datos mock" : "ok"} />;`],
  ])("falla con %s", (_n, fuente) => {
    expect(escanearFuente(fuente)).not.toEqual([]);
  });

  it("no cuenta comentarios, imports ni clases", () => {
    const fuente = `// MVP /api/ TODO\nimport m from "@/mock/api/x";\n/** Placeholder */\nexport const A = () => <p className="mock /api/" data-x="MVP">Todo listo {/* MVP */}</p>;`;
    expect(escanearFuente(fuente)).toEqual([]);
  });
});
