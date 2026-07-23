/* eslint-disable */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("📸 Starting visual screenshot test...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const artifactDir = 'C:\\Users\\Guvi\\.gemini\antigravity-ide\\brain\\34103831-0753-49ca-aa5f-dbaa938539f3';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    const page = await context.newPage();

    // -------------------------------------------------------------
    // TEST 1: LOGIN AS SAFEWAY FIRE SAFETY ADMIN
    // -------------------------------------------------------------
    console.log("Testing Safeway Fire Safety Client...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/enquiry', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Take screenshot of Safeway dashboard
    await page.screenshot({ path: path.join(artifactDir, 'safeway_dashboard.png') });
    console.log("📸 Saved safeway_dashboard.png");

    // Logout
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      // Clear cookie or call logout api
      fetch('/api/auth/logout', { method: 'POST' });
    });
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // TEST 2: LOGIN AS ARCTIC HVAC ADMIN
    // -------------------------------------------------------------
    console.log("Testing Arctic HVAC Client...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/enquiry', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Take screenshot of HVAC dashboard
    await page.screenshot({ path: path.join(artifactDir, 'hvac_dashboard.png') });
    console.log("📸 Saved hvac_dashboard.png");

  } catch (err) {
    console.error("❌ Visual test failed:", err);
  } finally {
    await browser.close();
  }
})();
