"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { FormPropiedad } from "./FormPropiedad";
import { ListaPropiedades } from "./ListaPropiedades";
import { useSites } from "../shell/SitesContext";

/** Sin parametros muestra la lista; ?nueva=1 abre el alta y ?propiedad=<id> la edicion. */
export function Propiedades() {
  const { sites, selectedId } = useSites();
  const q = useSearchParams();
  const id = q?.get("propiedad") ?? null;
  if (!id && q?.get("nueva") !== "1") return <ListaPropiedades />;
  return <FormPropiedad key={id ?? "nueva"} siteId={selectedId ?? sites[0]?.id ?? null} listingId={id} />;
}
