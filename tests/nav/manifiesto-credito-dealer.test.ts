/**
 * Regresión PROMO: el manifiesto de páginas quedó desfasado respecto al crédito del dealer en
 * Dealer OS (#827 movió /credit-hub/dealer/** a /autos/dealer/credito/** mientras #831 añadía el
 * manifiesto; cada PR pasaba solo y la promoción staging→main fallaba al juntarlos).
 * Este test falla con un mensaje directo si el manifiesto y dealerCreditRoutes divergen.
 */
import fs from "fs";
import path from "path";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";
import { DEALER_CREDIT_BASE, DEALER_CREDIT_LEGACY_REDIRECTS } from "@/lib/credit-hub/dealer/dealerCreditRoutes";

const RAIZ = path.resolve(__dirname, "../..");
const porRuta = new Map(MANIFIESTO_PAGINAS.map((e) => [e.ruta, e]));
const aManifiesto = (r: string) => r.replace(/:(\w+)/g, "[$1]");

describe("manifiesto: crédito del dealer en Dealer OS", () => {
  it.each(DEALER_CREDIT_LEGACY_REDIRECTS.map((r) => [r.source, r.destination]))(
    "la ruta legada %s está en el manifiesto como redirigida a %s",
    (source, destination) => {
      const e = porRuta.get(aManifiesto(source));
      if (!e || !fs.existsSync(path.join(RAIZ, e.archivo))) return; // sin página legada no hay nada que clasificar
      expect(e.categoria).toBe("redirigida");
      expect((e as { destino?: string }).destino).toBe(destination);
    },
  );

  it("cada página bajo /autos/dealer/credito está en el manifiesto", () => {
    const base = path.join(RAIZ, "app", DEALER_CREDIT_BASE);
    const paginas: string[] = [];
    const recorre = (dir: string) => {
      for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
        if (d.isDirectory()) recorre(path.join(dir, d.name));
        else if (d.name === "page.tsx") paginas.push(path.relative(path.join(RAIZ, "app"), path.join(dir, d.name)));
      }
    };
    recorre(base);
    const faltan = paginas.filter((p) => !MANIFIESTO_PAGINAS.some((e) => e.archivo === `app/${p.replace(/\\/g, "/")}`));
    expect(faltan).toEqual([]);
  });
});
