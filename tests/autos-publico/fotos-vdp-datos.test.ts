/** F4C-1-FOTOS-VDP parte 1/2: photoCount sale de las fotos reales, nunca del id. */
import { photoCount } from "@/lib/vehicles";

describe("photoCount", () => {
  it("sin fotos ni contador -> undefined (nada inventado)", () => {
    expect(photoCount({})).toBeUndefined();
  });
  it("conserva el contador real del backend si no hay lista", () => {
    expect(photoCount({ photoCount: 5 })).toBe(5);
  });
});
