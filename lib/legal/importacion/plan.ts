/**
 * Importación masiva de expedientes desde una carpeta (26-nov-2026).
 *
 * El abogado elige la carpeta donde guarda sus casos. Cada subcarpeta de primer nivel es un expediente;
 * los archivos sueltos de la raíz forman un expediente con el nombre de la carpeta. Lo que está más
 * adentro pertenece a su subcarpeta de primer nivel. Se suben PDF, PNG y JPEG hasta el máximo por archivo;
 * lo demás se informa como omitido. Un nombre «Cliente - Asunto» da el cliente; si no, el cliente es el
 * nombre de la carpeta, y el abogado lo corrige después.
 */
export type ArchivoImportable = { file: File; ruta: string };
export type GrupoImportacion = { titulo: string; cliente: string; archivos: ArchivoImportable[]; bytes: number };
export type Omitido = { ruta: string; motivo: "tipo" | "tamano" | "vacio" | "oculto" };
export type PlanImportacion = { grupos: GrupoImportacion[]; omitidos: Omitido[]; bytes: number; documentos: number };

export const EXTENSIONES = ["pdf", "png", "jpg", "jpeg"] as const;
export const MAX_MB_POR_DEFECTO = 15;

const ruta = (f: File) => ((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name).replace(/\\/g, "/");

export function clienteDe(titulo: string): string {
  const partes = titulo.split(/\s+[-–—]\s+/);
  return (partes.length > 1 ? partes[0] : titulo).trim() || titulo;
}

export function planificar(files: File[], maxMb: number = MAX_MB_POR_DEFECTO): PlanImportacion {
  const max = maxMb * 1024 * 1024;
  const grupos = new Map<string, GrupoImportacion>();
  const omitidos: Omitido[] = [];
  for (const file of files) {
    const r = ruta(file);
    const partes = r.split("/").filter(Boolean);
    const nombre = partes[partes.length - 1] ?? file.name;
    if (partes.some((p) => p.startsWith(".")) || nombre === "Thumbs.db" || nombre === "desktop.ini") {
      omitidos.push({ ruta: r, motivo: "oculto" });
      continue;
    }
    const ext = nombre.includes(".") ? nombre.split(".").pop()!.toLowerCase() : "";
    if (!(EXTENSIONES as readonly string[]).includes(ext)) { omitidos.push({ ruta: r, motivo: "tipo" }); continue; }
    if (file.size === 0) { omitidos.push({ ruta: r, motivo: "vacio" }); continue; }
    if (file.size > max) { omitidos.push({ ruta: r, motivo: "tamano" }); continue; }
    // raiz/sub/.../archivo -> "sub"; raiz/archivo -> "raiz"; archivo suelto (sin carpeta) -> "Documentos importados"
    const titulo = (partes.length >= 3 ? partes[1] : partes.length === 2 ? partes[0] : "Documentos importados").trim();
    const g = grupos.get(titulo) ?? { titulo, cliente: clienteDe(titulo), archivos: [], bytes: 0 };
    g.archivos.push({ file, ruta: r });
    g.bytes += file.size;
    grupos.set(titulo, g);
  }
  const lista = [...grupos.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  for (const g of lista) g.archivos.sort((a, b) => a.ruta.localeCompare(b.ruta, "es"));
  return { grupos: lista, omitidos, bytes: lista.reduce((s, g) => s + g.bytes, 0),
    documentos: lista.reduce((s, g) => s + g.archivos.length, 0) };
}

export const tituloDocumento = (r: string) => (r.split("/").pop() ?? r).replace(/\.[^.]+$/, "");
