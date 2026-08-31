/** Projects Core is only relevant inside its own portal. */
export function shouldLoadProjectsSidebar(pathname: string | null): boolean {
  return pathname === "/proyectos" || pathname?.startsWith("/proyectos/") === true;
}
