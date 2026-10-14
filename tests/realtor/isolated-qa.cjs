/* Real React hydration, offline in Chromium; no Next route or business runtime. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const ts = require("typescript"), React = require("react");
const { renderToString } = require("react-dom/server");
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
const temp = fs.mkdtempSync(path.join(require("os").tmpdir(), "realtor-qa-"));
const entry = path.join(temp, "entry.cjs"), loader = path.join(__dirname, "qa-loader.cjs");
fs.writeFileSync(entry, `const React=require(${JSON.stringify(require.resolve("react"))});const {hydrateRoot}=require(${JSON.stringify(require.resolve("react-dom/client"))});const {LicenseBrokerDraft}=require(${JSON.stringify(path.join(componentRoot,"LicenseBrokerDraft.tsx"))});hydrateRoot(document.getElementById('root'),React.createElement(LicenseBrokerDraft,window.testProps));`);
const id = "00000000-0000-4000-8000-000000000001";
const props = { licenseAvailability: "ready", brokerAvailability: "ready", supervisionRequired: true,
  jurisdictions: [{ code: "US-FL", label: "Jurisdicción sintética", licenseTypes: [{ id: "synth-agent", label: "Tipo sintético" }] }],
  brokerages: [{ id, label: "Firma sintética" }], supervisors: [{ id, label: "Supervisor sintético" }] };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => require("webpack")({ mode: "development", devtool: false, entry,
    output: { path: temp, filename: "bundle.js" }, resolve: { extensions: [".tsx", ".ts", ".js"], modules: [path.dirname(require.resolve("react/package.json")), "node_modules"] },
    module: { rules: [{ test: /\.(tsx?|css)$/, use: loader }] },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString())) : resolve()));
  const bundle = fs.readFileSync(path.join(temp, "bundle.js"), "utf8");
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [390, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
      const page = await context.newPage();
      await context.setOffline(true);
      const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      const mount = async data => {
        const markup = renderToString(React.createElement(LicenseBrokerDraft, data));
        await page.setContent('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Realtor isolated QA</title><style>body{margin:0;background:#F3F5F7}' + css + '</style></head><body><main><p style="text-align:center">PRUEBA AISLADA · datos sintéticos · React hidratado</p><div id="root">' + markup + '</div></main></body></html>');
        await page.evaluate(data => { window.testProps = data; }, data); await page.addScriptTag({ content: bundle });
        await page.waitForFunction(() => document.activeElement?.tagName === "H2");
      };
      const focused = async locator => assert(await locator.evaluate(el => el === document.activeElement));
      const audit = async name => {
        assert.deepStrictEqual((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map(v => v.id), []);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "horizontal overflow");
        await page.screenshot({ path: path.join(output, name + "-" + width + ".png"), fullPage: true });
      };
      await mount(props); await page.keyboard.press("Tab"); await focused(page.getByLabel("Jurisdicción"));
      assert(await page.getByLabel("Jurisdicción").evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) >= 3));
      await page.getByRole("button", { name: "Continuar a Broker" }).click();
      assert.strictEqual(await page.getByRole("alert").count(), 3); await focused(page.getByLabel("Jurisdicción")); await audit("license-errors");
      await page.keyboard.press("ArrowDown"); await page.keyboard.press("Tab"); await focused(page.getByLabel("Tipo de licencia"));
      await page.keyboard.press("ArrowDown"); await page.keyboard.press("Tab"); await page.keyboard.type("SYNTH-123");
      await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); assert(await page.getByRole("status").isVisible()); await audit("license");
      await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await focused(page.getByRole("heading", { name: "Broker", exact: true }));
      await page.getByRole("button", { name: "Revisar datos" }).click(); await focused(page.getByLabel("Broker supervisor")); assert.strictEqual(await page.getByRole("alert").count(), 1);
      await page.getByLabel("Broker supervisor").selectOption(id); await page.getByRole("button", { name: "Revisar datos" }).click();
      assert(await page.getByRole("status").isVisible()); assert.strictEqual(await page.getByLabel("Firma de corretaje (opcional)").inputValue(), ""); await audit("broker");
      await page.getByRole("button", { name: "Volver a Licencia" }).click(); await focused(page.getByRole("heading", { name: "Licencia", exact: true }));
      assert.strictEqual(await page.getByLabel("Número de licencia").inputValue(), "SYNTH-123"); assert.strictEqual(await page.getByLabel("Tipo de licencia").inputValue(), "synth-agent"); assert.strictEqual(await page.getByLabel("Jurisdicción").inputValue(), "US-FL");
      await page.getByRole("button", { name: "Continuar a Broker" }).click(); assert.strictEqual(await page.getByLabel("Broker supervisor").inputValue(), id);
      await page.getByLabel("Firma de corretaje (opcional)").selectOption(id); await page.getByRole("button", { name: "Volver a Licencia" }).click(); await page.getByRole("button", { name: "Continuar a Broker" }).click(); assert.strictEqual(await page.getByLabel("Firma de corretaje (opcional)").inputValue(), id);
      for (const [name, overrides, ready] of [["optional", { supervisionRequired: false, brokerages: [], supervisors: [] }, true], ["missing-pack", { supervisionRequired: undefined }, false], ["missing-supervisors", { supervisors: [] }, false]]) {
        await mount({ ...props, initialStep: "broker", ...overrides });
        assert.strictEqual(await page.getByRole("button", { name: "Revisar datos" }).count(), ready ? 1 : 0);
        if (ready) { await page.getByRole("button", { name: "Revisar datos" }).click(); assert(await page.getByRole("status").isVisible()); }
        else assert(await page.getByRole("status").isVisible()); await audit(name);
      }
      await mount({ ...props, jurisdictions: [] }); assert.strictEqual(await page.locator("form").count(), 0); assert(await page.getByRole("status").isVisible()); await audit("missing-jurisdictions");
      assert.deepStrictEqual(errors, []); results.push({ width, flow: "PASS", optional: "PASS", missingCatalogs: "PASS", axe: "PASS", overflow: "PASS", consoleErrors: errors.length });
      await context.close();
    }
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
