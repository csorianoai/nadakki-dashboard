import { objectiveLabel, segmentTypeLabel, channelLabel, propia } from "@/lib/marketing/campaignWizardCopy";

describe("claves heredadas de Object.prototype", () => {
  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])("%s no devuelve una función del prototipo", (k) => {
    expect(objectiveLabel(k)).toBe(k);
    expect(segmentTypeLabel(k)).toBe(k);
    expect(channelLabel(k)).toBe(k);
    expect(propia({ a: "x" }, k)).toBeUndefined();
  });
  it("etiquetas nuevas en español", () => {
    expect(objectiveLabel("recover")).toBe("Recuperar");
    expect(segmentTypeLabel("behavioral")).toBe("Por comportamiento");
  });
});
