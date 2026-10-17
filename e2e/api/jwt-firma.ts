/** Cambia el último carácter de la firma (tercer segmento) por otro distinto. */
export function conFirmaAlterada(jwt: string): string {
  const [h, p, s = ""] = jwt.split(".");
  const ultimo = s.slice(-1) === "A" ? "B" : "A";
  return `${h}.${p}.${s.slice(0, -1)}${ultimo}`;
}
