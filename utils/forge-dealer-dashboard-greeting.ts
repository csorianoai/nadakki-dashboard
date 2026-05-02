/** Dealer Forge dashboard hero line — locale-aware (Phase 6 reusability). */
export function forgeDealerDashboardHeadline(locale: string, displayName: string): string {
  const loc = locale.toLowerCase();
  const name = displayName.trim() && displayName !== "—" ? displayName.trim() : "equipo";
  if (loc.startsWith("es")) {
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    return `${greet}, ${name}. Sigamos concretando aprobaciones hoy.`;
  }
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${greet}, ${name}. Let's get someone approved today.`;
}
