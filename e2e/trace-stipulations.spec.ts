import { test } from "@playwright/test";

const BACKEND = "https://api.nadakki.com";
const FRONTEND = "http://localhost:3000";
const APPLICATION_ID = "6a68b243-567b-493d-9b7d-68fd048eb62d";

test("Trace stipulations network and DOM", async ({ page }) => {
  // Capture all network requests
  const requests: Array<{ url: string; status: number; body: any }> = [];
  
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("stipulation") || url.includes(APPLICATION_ID)) {
      try {
        const body = await response.text();
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        requests.push({
          url,
          status: response.status(),
          body: parsed,
        });
      } catch (e) {
        console.log(`Could not capture response for ${url}: ${e}`);
      }
    }
  });

  // Login as bank user
  // Using credentials from a known working test tenant
  const bankEmail = "analista-1786726199585@example.com";
  const bankPassword = "QAPassword123!";
  const tenantSlug = "qa-e2e-1786726199585";

  await page.goto(`${FRONTEND}/login`);
  await page.waitForLoadState("domcontentloaded");

  const emailInput = await page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(bankEmail);

  const passwordInput = await page.locator('input[type="password"]').first();
  await passwordInput.fill(bankPassword);

  const tenantInput = await page.locator('input[type="text"]').first();
  await tenantInput.fill(tenantSlug);

  const submitButton = await page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Wait for redirect
  await page.waitForURL(/credit-hub\/bank/, { timeout: 30000 });
  console.log("✓ Bank login successful");

  // Navigate to the specific application
  await page.goto(`${FRONTEND}/credit-hub/bank/applications/${APPLICATION_ID}`);
  await page.waitForLoadState("domcontentloaded");
  console.log(`✓ Navigated to application ${APPLICATION_ID}`);

  // Wait a bit for the page to settle
  await page.waitForTimeout(2000);

  // Find and click on Stipulations tab
  // Look for tab with text "Estipulaciones" or similar
  const tabs = await page.locator('button, a, div[role="tab"]').all();
  let stipulationsTabFound = false;

  for (const tab of tabs) {
    const text = await tab.textContent();
    if (text && (text.includes("Estipulacion") || text.includes("estipulacion"))) {
      console.log(`Found tab with text: "${text}"`);
      await tab.click();
      stipulationsTabFound = true;
      break;
    }
  }

  if (!stipulationsTabFound) {
    console.log("⚠️  Could not find Stipulations tab by text, trying data-value attribute");
    const tabByValue = await page.locator('[data-value="stipulations"], [data-value="estipulaciones"]').first();
    if (await tabByValue.count() > 0) {
      await tabByValue.click();
      console.log("✓ Clicked tab by data-value");
    }
  }

  // Wait for network requests to complete
  await page.waitForTimeout(3000);

  console.log("\n=== NETWORK REQUESTS ===");
  for (const req of requests) {
    console.log(`\nURL: ${req.url}`);
    console.log(`Status: ${req.status}`);
    console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  console.log("=== END NETWORK REQUESTS ===\n");

  // Find the error message in DOM
  console.log("=== DOM INSPECTION ===");
  
  const errorText = await page.locator('text="Estipulaciones no disponibles"').first();
  if (await errorText.count() > 0) {
    console.log("✓ Found error text in DOM");
    
    // Get the component hierarchy
    const handle = await errorText.elementHandle();
    if (handle) {
      // Get parent elements to understand component structure
      const parent1 = await handle.evaluateHandle((el) => el.parentElement);
      const parent2 = await parent1.evaluateHandle((el: any) => el?.parentElement);
      const parent3 = await parent2.evaluateHandle((el: any) => el?.parentElement);
      
      const parent1Html = await parent1.evaluate((el: any) => {
        if (!el) return "null";
        return `<${el.tagName.toLowerCase()} class="${el.className}" ${Array.from(el.attributes).map((a: any) => `${a.name}="${a.value}"`).join(" ")}>`;
      });
      
      const parent2Html = await parent2.evaluate((el: any) => {
        if (!el) return "null";
        return `<${el.tagName.toLowerCase()} class="${el.className}" ${Array.from(el.attributes).map((a: any) => `${a.name}="${a.value}"`).join(" ")}>`;
      });
      
      const parent3Html = await parent3.evaluate((el: any) => {
        if (!el) return "null";
        return `<${el.tagName.toLowerCase()} class="${el.className}" ${Array.from(el.attributes).map((a: any) => `${a.name}="${a.value}"`).join(" ")}>`;
      });
      
      console.log("Parent hierarchy:");
      console.log(`  3rd: ${parent3Html}`);
      console.log(`  2nd: ${parent2Html}`);
      console.log(`  1st: ${parent1Html}`);
    }
    
    // Get all text content around the error
    const container = await page.locator('text="Estipulaciones no disponibles"').first().locator('xpath=ancestor::div[3]');
    const containerHtml = await container.evaluate((el) => el.outerHTML.substring(0, 500));
    console.log(`\nContainer HTML (first 500 chars):\n${containerHtml}`);
  } else {
    console.log("❌ Error text NOT found in DOM");
    
    // List all visible text containing "estipulacion"
    const allText = await page.locator('text=/estipulacion/i').allTextContents();
    console.log(`Found ${allText.length} elements with "estipulacion":`);
    for (const t of allText) {
      console.log(`  - "${t}"`);
    }
  }
  
  console.log("=== END DOM INSPECTION ===\n");

  // Take a screenshot
  await page.screenshot({ path: "test-results/stipulations-trace.png", fullPage: true });
  console.log("✓ Screenshot saved to test-results/stipulations-trace.png");
});
