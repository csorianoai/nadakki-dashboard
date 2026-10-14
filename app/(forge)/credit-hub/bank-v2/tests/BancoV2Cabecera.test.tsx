import { usuarioCabecera } from "@/app/(forge)/credit-hub/bank-v2/BancoV2Shell";

/** Cabecera del banco v2: nombre o email del usuario, nunca "Usuario" si hay email. */
describe("usuarioCabecera", () => {
  it("con nombre: nombre, rol e iniciales tal cual", () => {
    expect(usuarioCabecera({ name: "Laura Méndez", initials: "LM", email: "laura@banco.do", role: "Credit Admin" })).toEqual({
      nombre: "Laura Méndez",
      rol: "Credit Admin",
      iniciales: "LM",
    });
  });

  it("sin nombre: el email y sus iniciales, no 'Usuario'", () => {
    expect(usuarioCabecera({ name: "Usuario", initials: "—", email: "ana.perez@banco.do", role: "Credit Admin" })).toEqual({
      nombre: "ana.perez@banco.do",
      rol: "Credit Admin",
      iniciales: "AN",
    });
  });

  it("sin nombre ni email: el respaldo explicito de siempre", () => {
    expect(usuarioCabecera({ name: "Usuario", initials: "—", email: "", role: "" })).toEqual({ nombre: "Usuario", rol: "", iniciales: "—" });
  });
});
