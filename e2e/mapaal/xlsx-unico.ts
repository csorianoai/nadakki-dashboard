/**
 * Reescribe el `nro_stock` del fixture de D7 en cada corrida. El backend NO
 * actualiza: `aplicar` rechaza la carga entera con 422 `STOCK_YA_EXISTE` si el
 * `nro_stock` ya esta en la base (importador.py), y QA-D7-0001 queda ocupado
 * desde la primera corrida buena. Sin dependencias: lee y escribe el zip con
 * `node:zlib` (las hojas llevan el texto en linea, sin sharedStrings).
 */
import { deflateRawSync, inflateRawSync } from "node:zlib";

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

type Entrada = { nombre: string; datos: Buffer };

function leerZip(zip: Buffer): Entrada[] {
  let fin = zip.length - 22;
  while (fin >= 0 && zip.readUInt32LE(fin) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error("fixture D7: no es un zip");
  const total = zip.readUInt16LE(fin + 10);
  let pos = zip.readUInt32LE(fin + 16);
  const entradas: Entrada[] = [];
  for (let i = 0; i < total; i++) {
    const metodo = zip.readUInt16LE(pos + 10);
    const tam = zip.readUInt32LE(pos + 20);
    const nNombre = zip.readUInt16LE(pos + 28);
    const nExtra = zip.readUInt16LE(pos + 30);
    const nComent = zip.readUInt16LE(pos + 32);
    const local = zip.readUInt32LE(pos + 42);
    const nombre = zip.subarray(pos + 46, pos + 46 + nNombre).toString("utf8");
    const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const crudo = zip.subarray(inicio, inicio + tam);
    entradas.push({ nombre, datos: metodo === 0 ? Buffer.from(crudo) : inflateRawSync(crudo) });
    pos += 46 + nNombre + nExtra + nComent;
  }
  return entradas;
}

function escribirZip(entradas: Entrada[]): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let desplazamiento = 0;
  for (const { nombre, datos } of entradas) {
    const nom = Buffer.from(nombre, "utf8");
    const comp = deflateRawSync(datos);
    const crc = crc32(datos);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nom.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nom.length, 28);
    central.writeUInt32LE(desplazamiento, 42);
    locales.push(local, nom, comp);
    centrales.push(central, nom);
    desplazamiento += 30 + nom.length + comp.length;
  }
  const dirCentral = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(dirCentral.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  return Buffer.concat([...locales, dirCentral, fin]);
}

/** Devuelve el xlsx con `desde` sustituido por `hasta` en todas las hojas. */
export function xlsxConStock(xlsx: Buffer, desde: string, hasta: string): { buffer: Buffer; cambios: number } {
  let cambios = 0;
  const entradas = leerZip(xlsx).map((e) => {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(e.nombre)) return e;
    const texto = e.datos.toString("utf8");
    const n = texto.split(desde).length - 1;
    if (!n) return e;
    cambios += n;
    return { nombre: e.nombre, datos: Buffer.from(texto.split(desde).join(hasta), "utf8") };
  });
  return { buffer: escribirZip(entradas), cambios };
}

/** `QA-D7-<marca de tiempo en base 36>`: unico por corrida, solo A-Z, 0-9 y guion. */
export function stockUnico(ahora = Date.now()): string {
  return `QA-D7-${ahora.toString(36).toUpperCase()}`;
}
