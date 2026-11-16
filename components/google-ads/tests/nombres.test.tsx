import fs from "fs";
import path from "path";
import { agentDisplayName, moduleDisplayTitle } from "@/lib/agentDisplayNames";

const root = path.resolve(__dirname, "../../..");
const FILES = [
  "app/advertising/google-ads/page.tsx",
  "app/advertising/google-ads/flow/page.tsx",
  "components/google-ads/GoogleAdsExecutionFlow.tsx",
  "lib/agentDisplayNames.ts",
];
const read = (p: string) => fs.readFileSync(path.join(root, p));

describe("mapa de nombres de agentes", () => {
  it.each([
    ["google_ads_budget_pacing_agent__googleadsbudgetpacingia", "Agente de ritmo de presupuesto"],
    ["google_ads_strategist_agent__googleadsstrategistia", "Agente estratega"],
    ["rsa_ad_copy_generator_agent__rsaadcopygeneratoria", "Generador de textos RSA"],
  ])("%s -> %s", (id, nombre) => {
    expect(agentDisplayName(id)).toBe(nombre);
  });

  it("un id desconocido da un nombre legible sin romper", () => {
    expect(agentDisplayName("foo_bar_agent__xyz")).toBe("Foo bar");
    expect(agentDisplayName("")).toBe("Agente");
    expect(agentDisplayName(undefined)).toBe("Agente");
    expect(agentDisplayName(null)).toBe("Agente");
  });

  it("titulos de modulos en espanol, con respaldo al titulo recibido", () => {
    expect(moduleDisplayTitle("m01", "Platform Fundamentals")).toBe("Fundamentos de la plataforma");
    expect(moduleDisplayTitle("zz", "Algo")).toBe("Algo");
  });
});

describe("barrido de ficheros", () => {
  it.each(FILES)("%s sin textos en ingles, mojibake ni BOM", (f) => {
    const buf = read(f);
    expect(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf).toBe(false);
    const src = buf.toString("utf8");
    expect(src).not.toMatch(/Not ready/);
    expect(src).not.toMatch(/Ã|â€|�/);
    expect(src).not.toMatch(/name: "[^"]*Agent"/);
    expect(src).not.toMatch(/"(Blocked|Proposal only|Required fixes|Unexpected status|Propose |Run )/);
    expect(src).not.toMatch(/Execution Flow|Hub<|Preflight service unavailable/);
  });
});
