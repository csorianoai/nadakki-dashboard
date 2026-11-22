/** F4C-1-FOTOS-VDP parte 1/2: photoCount sale de las fotos reales, nunca del id. */
import { photoCount } from "@/lib/vehicles";

describe("photoCount", () => {
  it("con fotos reales devuelve exactamente photos.length", () => {
    expect(photoCount({ photos: ["a", "b", "c"] })).toBe(3);
  });
  it("photos manda sobre photoCount cuando ambos existen", () => {
    expect(photoCount({ photos: ["a", "b"], photoCount: 9 })).toBe(2);
  });
  it("sin fotos ni contador -> undefined (nada inventado)", () => {
    expect(photoCount({})).toBeUndefined();
    expect(photoCount({ photos: [] })).toBeUndefined();
  });
  it("conserva el contador real del backend si no hay lista", () => {
    expect(photoCount({ photoCount: 5 })).toBe(5);
  });
});
