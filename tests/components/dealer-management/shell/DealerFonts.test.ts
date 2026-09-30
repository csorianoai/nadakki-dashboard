jest.mock("next/font/google", () => ({
  Sora: () => ({ variable: "--font-sora" }),
  IBM_Plex_Sans: () => ({ variable: "--font-ibm-plex-sans" }),
  IBM_Plex_Mono: () => ({ variable: "--font-ibm-plex-mono" }),
}));

import { dealerFontVariables } from "@/components/dealer-management/shell/DealerFonts";

describe("DealerFonts", () => {
  test("expone las tres variables tipograficas del panel", () => {
    expect(dealerFontVariables).toBe(
      "--font-sora --font-ibm-plex-sans --font-ibm-plex-mono",
    );
  });
});
