/* eslint-disable */
const { chromium } = require('@playwright/test');

(async () => {
  console.log("🚀 Launching Chromium browser in VISIBLE mode...");
  // Launch in non-headless mode so the user can watch it!
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log("STEP 1: Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log("STEP 2: Logging in as HVAC Admin ( James )...");
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for the main dashboard to load (Admins redirect to /admin/enquiry)
    await page.waitForURL('**/admin/enquiry', { timeout: 15000 });
    console.log("✅ Logged in successfully! Showing HVAC Admin Enquiry Dashboard.");
    await page.waitForTimeout(4000);

    console.log("STEP 3: Navigating to Dynamic Sandbox Dashboard...");
    // Go to sandbox view
    await page.goto('http://localhost:3000/admin/sandbox/dashboard/ENQUIRY', { waitUntil: 'networkidle' });
    console.log("✅ Showing Dynamic Sandbox View with HVAC columns!");
    await page.waitForTimeout(6000);

    console.log("🎉 Verification complete. Closing browser...");
  } catch (err) {
    console.error("❌ Test encountered an error:", err);
  } finally {
    await browser.close();
  }
})();
