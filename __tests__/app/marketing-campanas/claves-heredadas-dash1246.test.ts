/**
 * Hallazgo de Vercel Security Review en el release dash#1246 (16-nov-2026): «Inherited-key template
 * objectives crash the shared campaign wizard». Una plantilla compartida con objetivo "constructor" hacía
 * que objectiveLabel devolviera una función heredada de Object.prototype y React rompía el asistente.
 */
import {
  channelLabel,
  fillPreviewExample,
  objectiveLabel,
  scheduleLabel,
  segmentTypeLabel,
} from "@/lib/marketing/campaignWizardCopy";

const HEREDADAS = ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__", "isPrototypeOf"];

describe("etiquetas del asistente: solo claves propias", () => {
  it.each(HEREDADAS)("objetivo, segmento, canal y programación con %s devuelven texto", (k) => {
    for (const f of [objectiveLabel, segmentTypeLabel, channelLabel, scheduleLabel]) {
      const r = f(k);
      expect(typeof r).toBe("string");
      expect(r).toBe(k);
    }
  });

  it("las claves conocidas siguen traducidas", () => {
    expect(objectiveLabel("convert")).toBe("Convertir");
    expect(channelLabel("email")).toBe("Correo");
    expect(segmentTypeLabel("dynamic")).toBe("Dinámico");
    expect(scheduleLabel("immediate")).toBe("Enviar ahora");
  });

  it("la vista previa no inserta código con {constructor}", () => {
    const { text } = fillPreviewExample("Hola {constructor} y {{toString}}");
    expect(text).toBe("Hola ejemplo y ejemplo");
    expect(text).not.toMatch(/function|native code/);
  });
});
