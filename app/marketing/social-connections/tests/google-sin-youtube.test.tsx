import { readFileSync } from "fs";
import { join } from "path";

// La conexión de Google solo pide adwords + analytics.readonly (sin YouTube):
// el nombre visible y el icono no deben anunciar YouTube.
const src = readFileSync(join(__dirname, "..", "SocialConnectionsClient.tsx"), "utf8");
const googleBlock = /\n  google: \{([\s\S]*?)\n  \},/.exec(src)?.[1] ?? "";

describe("conexión de Google en social-connections", () => {
  it("encuentra el bloque de Google", () => {
    expect(googleBlock).toContain("name:");
  });
  it("el nombre visible no contiene YouTube", () => {
    const name = /name:\s*"([^"]*)"/.exec(googleBlock)?.[1] ?? "";
    expect(name).toBe("Google (Ads + Analytics)");
    expect(name).not.toMatch(/youtube/i);
  });
  it("el icono no es el de YouTube", () => {
    expect(googleBlock).not.toMatch(/youtube/i);
  });
});
