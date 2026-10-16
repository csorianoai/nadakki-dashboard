/** Pantalla de cambio de contraseña (app/(auth)/cambiar-contrasena). */
export const PASSWORD_CHANGE_ROUTE = "/cambiar-contrasena";

/** error_code con el que el backend corta toda ruta salvo /me y /change-password. */
export const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

/**
 * Lleva el navegador a la pantalla de cambio. Navegación completa (replace):
 * el init de sesión corre otra vez allí y vuelve a detectar la marca. Es un
 * módulo aparte para que los tests lo sustituyan.
 */
export function goToPasswordChange(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === PASSWORD_CHANGE_ROUTE) return;
  window.location.replace(PASSWORD_CHANGE_ROUTE);
}
