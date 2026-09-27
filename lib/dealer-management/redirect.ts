export function resolveDealerManagementRedirect(path: string): string {
  return path === "/credit-hub/dealer" ? "/autos/dealer" : path;
}
