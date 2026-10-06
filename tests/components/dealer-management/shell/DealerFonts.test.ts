import { readFileSync } from "fs";
import { join } from "path";

import { dealerFontVariables } from "@/components/dealer-management/shell/DealerFonts";

describe("DealerFonts", () => {
  test("expone las tres variables tipograficas del panel", () => {
    expect(dealerFontVariables).toBe(
      "--font-sora --font-ibm-plex-sans --font-ibm-plex-mono",
    );
  });

  test("el shell las pone en su raiz data-portal=dealer (antes no se importaban en ningun sitio)", () => {
    const shell = readFileSync(
      join(process.cwd(), "components/dealer-management/shell/DealerShell.tsx"),
      "utf8",
    );
    expect(shell).toMatch(/import \{ dealerFontVariables \} from "\.\/DealerFonts";/);
    const raiz = /<div\s+data-portal="dealer"[\s\S]*?>/.exec(shell)?.[0] ?? "";
    expect(raiz).toContain("${dealerFontVariables}");
  });
});
