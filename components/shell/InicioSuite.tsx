"use client";

import type { ReactNode } from "react";
import { ModuleShell } from "./ModuleShell";

/**
 * La portada «/» y /notifications: siguen siendo la Suite. Mismo armazón que los módulos, pero su menú lateral
 * sirve para ELEGIR módulo (los que este usuario ve). El contenido de la página no cambia.
 */
export function InicioSuite({ children }: { children: ReactNode }) {
  return <ModuleShell modulo={null}>{children}</ModuleShell>;
}
