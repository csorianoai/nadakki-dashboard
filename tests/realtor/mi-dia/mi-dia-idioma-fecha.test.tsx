import { act, fireEvent, render, screen } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { miDiaEn, miDiaEs } from "@/lib/realtor/mi-dia/copy";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn().mockResolvedValue({ status: 200, json: async () => ({ demo: true }) }) }));

// 2026-10-17T03:30Z es todavía viernes 16 en Santo Domingo (UTC-4).
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask", "nextTick", "setImmediate"] });
  jest.setSystemTime(new Date("2026-10-17T03:30:00Z"));
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  jest.spyOn(window.navigator, "language", "get").mockReturnValue("en-US");
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

it("(a) navegador en inglés: el panel arranca en español con la fecha de hoy en la zona del tenant", async () => {
  render(<MiDiaPanel />);
  await flush();
  const panel = await screen.findByTestId("mi-dia-panel");
  expect(panel).toHaveAttribute("lang", "es");
  // 23:30 en Santo Domingo: el saludo es de noche (ROP-UX-QUICKFIX).
  expect(panel).toHaveTextContent(miDiaEs.greetingEvening);
  expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("viernes, 16 de octubre de 2026");
});

it("(b) el conmutador pasa a inglés y la fecha sigue en el día 16", async () => {
  render(<MiDiaPanel />);
  await flush();
  fireEvent.click(await screen.findByTestId("lang-en"));
  expect(screen.getByTestId("mi-dia-panel")).toHaveAttribute("lang", "en");
  expect(screen.getByTestId("mi-dia-panel")).toHaveTextContent(miDiaEn.greetingEvening);
  expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("Friday, October 16, 2026");
  fireEvent.click(screen.getByTestId("lang-es"));
  expect(screen.getByTestId("mi-dia-panel")).toHaveAttribute("lang", "es");
});

it("(c) sin DEMO la fecha se ve y no hay otras cifras", async () => {
  render(<MiDiaPanel />);
  await flush();
  await screen.findByTestId("mi-dia-empty");
  const date = screen.getByTestId("mi-dia-date");
  expect(date).toBeInTheDocument();
  const rest = screen.getByTestId("mi-dia-panel").textContent!.replace(date.textContent!, "");
  expect(rest).not.toMatch(/\d/);
});

it("en DEMO el rótulo ya no habla de fecha fija", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  render(<MiDiaPanel />);
  await flush();
  await screen.findByTestId("mi-dia-demo");
  expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("viernes, 16 de octubre de 2026");
  expect(screen.getByTestId("mi-dia-panel").textContent).not.toMatch(/fecha fija|fixed/i);
});

it("(d) ningún texto EN de miDiaEn fuera de copy.ts", () => {
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((n) => {
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) && files.push(p);
  });
  walk(join(process.cwd(), "app/realtor/mi-dia"));
  walk(join(process.cwd(), "components/realtor/mi-dia"));
  const values = Object.values(miDiaEn).filter((v): v is string => typeof v === "string" && v.includes(" ") && !(Object.values(miDiaEs) as unknown[]).includes(v));
  const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
  values.forEach((v) => expect(src).not.toContain(v));
  expect(values).toContain("Good morning. This is your plan.");
});
