import fs from "fs";
import path from "path";
import ts from "typescript";

/**
 * DB-CODEX-23. Busca notas de desarrollo en el texto JSX VISIBLE del Credit Hub: texto entre etiquetas,
 * literales dentro de {...} hijos y props title/description/detalle. Usa el AST de TypeScript, asi que
 * comentarios, imports, nombres de variable y clases no cuentan.
 */
export const PROHIBIDOS = /\b(MVP|TODO|FIXME|DIAGNOSTIC|Placeholder|[Mm]ock)\b|available:\s*false|\/api\//;
const PROPS_VISIBLES = new Set(["title", "description", "detalle"]);

export const RAICES = ["app/(forge)/credit-hub", "components/credit-hub", "components/forge/credit-hub"];

export type Hallazgo = { texto: string; linea: number };

function cadenas(nodo: ts.Node): string[] {
  if (ts.isStringLiteralLike(nodo)) return [nodo.text];
  if (ts.isTemplateExpression(nodo)) return [nodo.head.text, ...nodo.templateSpans.map((s) => s.literal.text)];
  if (ts.isConditionalExpression(nodo)) return [...cadenas(nodo.whenTrue), ...cadenas(nodo.whenFalse)];
  if (ts.isParenthesizedExpression(nodo)) return cadenas(nodo.expression);
  if (ts.isBinaryExpression(nodo)) return [...cadenas(nodo.left), ...cadenas(nodo.right)];
  return [];
}

export function escanearFuente(fuente: string, nombre = "fixture.tsx"): Hallazgo[] {
  const sf = ts.createSourceFile(nombre, fuente, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: Hallazgo[] = [];
  const revisar = (texto: string, nodo: ts.Node) => {
    if (PROHIBIDOS.test(texto)) out.push({ texto: texto.trim(), linea: sf.getLineAndCharacterOfPosition(nodo.getStart(sf)).line + 1 });
  };
  const visitar = (n: ts.Node) => {
    if (ts.isJsxText(n)) revisar(n.text, n);
    else if (ts.isJsxAttribute(n) && PROPS_VISIBLES.has(n.name.getText(sf)) && n.initializer) {
      const ini = n.initializer;
      if (ts.isStringLiteral(ini)) revisar(ini.text, ini);
      else if (ts.isJsxExpression(ini) && ini.expression) cadenas(ini.expression).forEach((t) => revisar(t, ini));
    } else if (ts.isJsxExpression(n) && n.expression && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent))) {
      cadenas(n.expression).forEach((t) => revisar(t, n));
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return out;
}

const EXCLUIDOS = /(\.test\.|\.spec\.|\.d\.ts$)|(^|\/)(__tests__|__mocks__|tests|mocks|node_modules)(\/|$)/;

export function archivosDelArbol(base: string): string[] {
  const lista: string[] = [];
  const andar = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, e.name);
      const rel = path.relative(base, ruta).split(path.sep).join("/");
      if (EXCLUIDOS.test(rel)) continue;
      if (e.isDirectory()) andar(ruta);
      else if (e.name.endsWith(".tsx")) lista.push(rel);
    }
  };
  RAICES.forEach((r) => andar(path.join(base, r)));
  return lista;
}
