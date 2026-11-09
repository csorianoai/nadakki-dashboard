"use client";

import React from "react";
import { pick } from "@/lib/sites/copy-util";
import { MED } from "@/lib/sites/medios/copy";
import { SIZE } from "@/lib/sites/tokens";
import { useSites } from "../shell/SitesContext";
import { FormMedio } from "./FormMedio";

/** PARTE 1/2: alta con registro de permiso. La lista y las acciones (revocar, editar) llegan en la PARTE 2/2. */
export function Medios() {
  const { sites, demo, selectedId, lang } = useSites();
  return (
    <div>
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{pick(MED.title, lang)}</h1>
      <FormMedio siteId={selectedId ?? sites[0]?.id ?? null} demo={demo} lang={lang} asset={null} onCancel={() => undefined} onDone={() => undefined} />
    </div>
  );
}
