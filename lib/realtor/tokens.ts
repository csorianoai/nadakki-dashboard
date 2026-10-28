/** Tokens del armazón de Realtor OS, tomados del prototipo DL10A (Nadakki_Realtor_OS_DL10A_autonomo.html). */
export const RT = {
  ink: "#13202B",
  inkDeep: "#0E1922",
  inkDarkest: "#0C1A24",
  muted: "#4A5A68",
  line: "#DCE2E8",
  lineStrong: "#B8C4CE",
  /** Borde de campos y botones secundarios: 4.36:1 sobre white y 3.99:1 sobre page (WCAG 1.4.11 pide 3:1; lineStrong da 1.78/1.62). */
  control: "#6B7B89",
  page: "#F3F5F7",
  white: "#FFFFFF",
  teal: "#0B6E78",
  cyan: "#6FD3DC",
  navText: "#E8EEF2",
  navMuted: "#A9BAC7",
  navGroup: "#8296A6",
  navBorder: "rgba(111, 211, 220, 0.16)",
  navField: "rgba(12, 26, 36, 0.7)",
  demoBg: "#FFF1D6",
  demoText: "#6E4300",
  barMuted: "#92B8C0",
  calloutBg: "#EAF4F5",
  calloutLine: "#CFE3E6",
  chipUpBg: "#E3F4EA",
  chipUpText: "#0B5A32",
  chipDownBg: "#FBE7E4",
  chipDownText: "#8A2418",
  sidebarWidth: 288,
} as const;

export const FONT_BODY = "var(--rt-font-body), 'IBM Plex Sans', Arial, sans-serif";
export const FONT_DISPLAY = "var(--rt-font-display), 'Space Grotesk', Arial, sans-serif";
