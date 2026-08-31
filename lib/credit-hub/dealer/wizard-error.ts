export function dealerWizardErrorMessage(error: unknown): string {
  if (error instanceof Error && "status" in error && (error as { status?: number }).status === 404) {
    return "No tienes autorización para editar esta solicitud. Solicita acceso al administrador.";
  }
  return error instanceof Error ? error.message : "No se pudo guardar el paso";
}
