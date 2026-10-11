/* Browser checks on the real components' static SSR output; no Next route or business runtime. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const componentRoot = path.resolve(__dirname, "../../components/realtor");
for (const ext of [".ts", ".tsx"]) require.extensions[ext] = (mod, filename) => {
  assert(filename.startsWith(componentRoot));
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
};
const css = fs.readFileSync(path.join(componentRoot, "LicenseBrokerDraft.module.css"), "utf8");
require.extensions[".css"] = mod => {
  mod.exports = Object.fromEntries([...css.matchAll(/\.([a-zA-Z]+)\b/g)].map(m => [m[1], m[1]]));
};
const { LicenseBrokerDraft } = require(path.join(componentRoot, "LicenseBrokerDraft.tsx"));
const output = path.resolve(__dirname, "../../docs/design/realtor/evidence/part1");
const id = "00000000-0000-4000-8000-000000000001";
const props = { licenseAvailability: "ready", brokerAvailability: "ready", supervisionRequired: true,
  jurisdictions: [{ code: "US-FL", label: "Jurisdicción sintética", licenseTypes: [{ id: "synth-agent", label: "Tipo sintético" }] }],
  brokerages: [{ id, label: "Firma sintética" }], supervisors: [{ id, label: "Supervisor sintético" }] };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [1440, 390]) for (const step of ["license", "broker"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
      const page = await context.newPage();
      await context.setOffline(true);
      const markup = renderToStaticMarkup(React.createElement(LicenseBrokerDraft, { ...props, initialStep: step }));
      await page.setContent('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Realtor isolated QA</title><style>body{margin:0;background:#F3F5F7}' + css + '</style></head><body><main><p style="text-align:center">PRUEBA AISLADA · datos sintéticos · render estático</p>' + markup + '</main></body></html>');
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      assert.deepStrictEqual(audit.violations.map(v => v.id), []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "horizontal overflow");
      const first = page.getByLabel(step === "license" ? "Jurisdicción" : "Firma de corretaje (opcional)");
      await first.focus(); await page.keyboard.press("Tab");
      assert(await page.getByLabel(step === "license" ? "Tipo de licencia" : "Broker supervisor").evaluate(el => el === document.activeElement));
      await page.screenshot({ path: path.join(output, step + "-" + width + ".png"), fullPage: true });
      results.push({ step, width, axeViolations: 0, overflow: false, keyboardTab: "PASS", render: "static SSR" });
      await context.close();
    }
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
