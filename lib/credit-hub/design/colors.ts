const avatarPalette = [
  "bg-forge-primary",
  "bg-forge-accent",
  "bg-forge-success",
  "bg-forge-info",
  "bg-forge-warning",
] as const;

export function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "—";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function avatarColorFromInitial(initial: string | null | undefined): string {
  const charCode = initial?.trim().toUpperCase().charCodeAt(0) ?? 0;
  return avatarPalette[charCode % avatarPalette.length];
}
