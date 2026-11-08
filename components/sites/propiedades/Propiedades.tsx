"use client";

import React from "react";
import { ListaPropiedades } from "./ListaPropiedades";

/** PARTE 1/2: solo la lista. El formulario de alta/edicion (?nueva=1, ?propiedad=<id>) llega en la PARTE 2/2. */
export function Propiedades() {
  return <ListaPropiedades />;
}
