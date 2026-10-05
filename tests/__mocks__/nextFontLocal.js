/**
 * Mock de next/font/local para jest. Fuera del build de Next no hay loader de
 * fuentes: devolvemos la variable CSS pedida y una clase vacia, que es lo unico
 * que el codigo consume.
 */
module.exports = function localFont(opciones = {}) {
  return { className: "", variable: opciones.variable || "", style: { fontFamily: "" } };
};
module.exports.default = module.exports;
module.exports.__esModule = true;
