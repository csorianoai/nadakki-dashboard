/**
 * Primeros pasos del concesionario: el cliente generico del motor de onboarding con core="autos".
 * Se conserva esta ruta y sus nombres para no tocar a quien ya la usa.
 */
import { CONFIG_CORES } from "@/lib/agents/onboarding/cores";
import { clientePrimerosPasos, validarDatos as validarGenerico } from "@/lib/agents/onboarding/primeros-pasos-client";

export type { OyenteProgreso, PasoInicial, PrimerosPasos } from "@/lib/agents/onboarding/primeros-pasos-client";
export { ANTIRREBOTE_MS, REFRESCO_AL_VOLVER_MS } from "@/lib/agents/onboarding/primeros-pasos-client";

const autos = clientePrimerosPasos("autos");

export const CLAVE_DATOS = CONFIG_CORES.autos.claveDatos("");
export const CLAVE_CERRADA = CONFIG_CORES.autos.claveCerrada("");

export const validarDatos = (d: unknown) => validarGenerico(d, CONFIG_CORES.autos.enlace);
export const obtenerPrimerosPasos = autos.obtener;
export const refrescarPrimerosPasos = autos.refrescar;
export const programarRefresco = autos.programarRefresco;
export const suscribirPrimerosPasos = autos.suscribir;
export const cerradaCon = autos.cerradaCon;
export const bienvenidaCerrada = autos.cerrada;
export const cerrarBienvenida = autos.cerrar;
export const __reiniciarBienvenida = autos.__reiniciar;
