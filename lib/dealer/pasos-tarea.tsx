/**
 * Pasos de una tarea del concesionario (cargar un auto, cargar una factura, vender). El componente vive ahora en el
 * motor de onboarding (components/ai/onboarding/PasosDeTarea.tsx) con colores por variable --onb-* cuyo valor por
 * defecto son los --dcc-* de siempre: las pantallas de Autos se ven igual y siguen importando desde aqui. Cada paso
 * pendiente con pantalla propia sigue siendo un enlace de texto tocable (44 px), ademas del boton "Siguiente paso".
 *
 * Avisar progreso: tras guardar algo que cambia el avance, llamar `avisarProgreso()`; la bienvenida y cualquier lista
 * que escuche `EVENTO_PROGRESO` se recalcula sin esperar a la proxima sesion.
 */
export {
  avisarProgreso,
  EVENTO_PROGRESO,
  PasosDeTarea,
  resumenPasos,
  type PasoTarea,
} from "@/components/ai/onboarding/PasosDeTarea";
