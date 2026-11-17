"use client";

import React, { useEffect, useState } from "react";
import { listPages } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { demoPages } from "@/lib/sites/mocks/pages";
import { PAG } from "@/lib/sites/paginas/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Page } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; items: Page[] } | { k: "error" };

export function ListaPaginas() {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const t = (k: string) => pick(PAG[k], lang);

  useEffect(() => {
    let vivo = true;
    if (demo) setC({ k: "ok", items: demoPages() });
    else if (!siteId) setC({ k: "error" });
    else {
      setC({ k: "cargando" });
      listPages(siteId).then(
        (r) => vivo && setC({ k: "ok", items: r.items }),
        () => vivo && setC({ k: "error" }),
      );
    }
    return () => { vivo = false; };
  }, [demo, siteId]);

  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "error") return <Aviso testid="estado-error-paginas" alert title={t("errListTitle")} body={t("errListBody")} />;
  if (!c.items.length) return <Aviso testid="estado-vacio-paginas" title={t("emptyTitle")} body={t("emptyBody")} />;
  const cell = { textAlign: "left" as const, padding: "8px 12px", borderBottom: `1px solid ${ST.line}` };
  return (
    <section data-testid="lista-paginas">
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t("listTitle")}</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", background: ST.white }}>
        <thead>
          <tr><th scope="col" style={cell}>{t("colKey")}</th><th scope="col" style={cell}>{t("colTitle")}</th><th scope="col" style={cell}>{t("colState")}</th><th scope="col" style={cell}><span style={{ position: "absolute", left: -9999 }}>{t("edit")}</span></th></tr>
        </thead>
        <tbody>
          {c.items.map((p) => (
            <tr key={p.id} data-testid={`pagina-${p.page_key}`}>
              <th scope="row" style={cell}>{p.page_key}</th>
              <td style={cell}>{p.title ? pick(p.title, lang) : t("noTitle")}</td>
              <td style={cell} data-testid={`estado-pagina-${p.page_key}`}>{t(p.status === "published" ? "published" : "draft")}</td>
              <td style={cell}>
                <a
                  className="sx-focus"
                  data-testid={`editar-${p.page_key}`}
                  href={`/mi-web/paginas?sitio=${encodeURIComponent(siteId ?? "")}&pagina=${encodeURIComponent(p.id)}`}
                  style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, padding: "0 14px", color: ST.ink }}
                >
                  {t("edit")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
