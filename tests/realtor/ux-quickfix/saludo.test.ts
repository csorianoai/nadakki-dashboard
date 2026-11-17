import { greetingFor, miDiaEn, miDiaEs } from "@/lib/realtor/mi-dia/copy";
import { ZONA_DO } from "@/lib/realtor/tenant-tz";

/**
 * ROP-UX-QUICKFIX: el saludo de Mi día sigue la hora del tenant, no dice siempre «Buenos días».
 * Traslado ROP-UX-HORA-TENANT: la zona ya no es fija; estos cortes se fijan para un tenant DO (America/Santo_Domingo,
 * UTC-4) pasando su zona explícitamente. Mismos instantes y mismas franjas que antes.
 */
describe("saludo según la hora del tenant", () => {
  it.each([
    ["2026-10-27T08:59:00Z", "noche"],      // 04:59
    ["2026-10-27T09:00:00Z", "mañana"],     // 05:00
    ["2026-10-27T15:59:00Z", "mañana"],     // 11:59
    ["2026-10-27T16:00:00Z", "tarde"],      // 12:00
    ["2026-10-27T22:59:00Z", "tarde"],      // 18:59
    ["2026-10-27T23:00:00Z", "noche"],      // 19:00
    ["2026-10-28T03:30:00Z", "noche"],      // 23:30
  ] as const)("%s → %s", (iso, franja) => {
    const now = new Date(iso);
    const es = { mañana: miDiaEs.greetingMorning, tarde: miDiaEs.greetingAfternoon, noche: miDiaEs.greetingEvening }[franja];
    const en = { mañana: miDiaEn.greetingMorning, tarde: miDiaEn.greetingAfternoon, noche: miDiaEn.greetingEvening }[franja];
    expect(greetingFor(miDiaEs, ZONA_DO, now)).toBe(es);
    expect(greetingFor(miDiaEn, ZONA_DO, now)).toBe(en);
  });
  it("los tres saludos existen en ES y EN y son distintos", () => {
    expect(miDiaEs.greetingMorning).toBe("Buenos días. Este es tu plan.");
    expect(miDiaEs.greetingAfternoon).toBe("Buenas tardes. Este es tu plan.");
    expect(miDiaEs.greetingEvening).toBe("Buenas noches. Este es tu plan.");
    expect(miDiaEn.greetingMorning).toBe("Good morning. This is your plan.");
    expect(miDiaEn.greetingAfternoon).toBe("Good afternoon. This is your plan.");
    expect(miDiaEn.greetingEvening).toBe("Good evening. This is your plan.");
  });
});
