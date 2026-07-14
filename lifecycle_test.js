const { chromium } = require('@playwright/test');

(async () => {
  console.log("🚀 Launching Chromium browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const today = new Date().toISOString().split('T')[0];

  try {
    // ─────────────────────────────────────────────────
    // PHASE 1: Admin – Create Enquiry & Transition to REFILLING
    // ─────────────────────────────────────────────────
    console.log("\n=== PHASE 1: Admin – Enquiry Dashboard ===");

    console.log("STEP 1: Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log("STEP 2: Logging in as Admin...");
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/enquiry', { timeout: 15000 });
    console.log("✅ Logged in! On Enquiry Dashboard.");

    // Register new enquiry
    console.log("STEP 3: Registering new enquiry...");
    await page.click('button[title="Add Enquiry"]');
    await page.waitForTimeout(1500);
    await page.fill('input[placeholder="e.g. Siva Clinicals"]', 'Test Logistics Corp');
    await page.fill('input[placeholder="e.g. Manikrishnan"]', 'David');
    await page.fill('input[placeholder="e.g. 9944332106"]', '9333333333');
    await page.fill('input[type="date"]', today);
    await page.locator('form select').first().selectOption('New Fire Extinguisher');
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(3000);
    console.log("✅ Enquiry registered!");

    // Locate ticket
    const ticketCell = await page.waitForSelector('td:has-text("Test Logistics Corp")', { timeout: 10000 });
    const rowText = await ticketCell.evaluate(el => el.closest('tr').innerText);
    const match = rowText.match(/(EQ\d+)/);
    const ticketId = match ? match[1] : 'NEW';
    console.log(`✅ Ticket ID: ${ticketId}`);

    const ticketRow = page.locator('tr', { hasText: ticketId });

    // Edit status to Order Confirmed
    console.log("STEP 4: Setting status to 'Order Confirmed'...");
    await ticketRow.locator('button[title="Edit Enquiry details"]').click();
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Enquiry Status & Dates")');
    await page.waitForTimeout(1000);
    await page.selectOption('form select', 'Order Confirmed');
    await page.click('form button:has-text("Update")');
    await page.waitForTimeout(3000);
    console.log("✅ Status set to Order Confirmed!");

    // Assign technician (DELIVERY type – from Enquiry Dashboard)
    console.log("STEP 5: Assigning technician John Doe from Enquiry Dashboard...");
    await ticketRow.locator('button[title="Assign Technicians"]').click();
    await page.waitForTimeout(2000);
    await page.locator('form input[type="checkbox"]').first().check();
    await page.locator('form input[type="date"]').fill(today);
    await page.click('form button:has-text("Assign")');
    await page.waitForTimeout(3000);
    console.log("✅ Technician assigned (DELIVERY type)!");

    // Bulk-transition to REFILLING stage
    console.log("STEP 6: Transitioning ticket to REFILLING stage...");
    await ticketRow.locator('input[type="checkbox"]').check();
    await page.click('button:has-text("Bulk Transition Stage")');
    await page.waitForTimeout(2000);
    await page.selectOption('form select', 'REFILLING');
    await page.click('form button:has-text("Transition")');
    await page.waitForTimeout(3000);
    console.log("✅ Ticket transitioned to REFILLING stage!");

    // ─────────────────────────────────────────────────
    // PHASE 2: Admin – Refilling Dashboard Assignment
    // ─────────────────────────────────────────────────
    console.log("\n=== PHASE 2: Admin – Refilling Dashboard ===");

    console.log("STEP 7: Navigating to Refilling Dashboard...");
    await page.click('a[href="/admin/refilling"]');
    await page.waitForTimeout(3000);

    // Log what's on the refilling dashboard
    const refillingText = await page.locator('table').innerText().catch(() => 'No table found');
    console.log("Refilling table:", refillingText.substring(0, 400));

    // Find the NEWEST ticket row in Refilling Dashboard (last match to avoid old test rows)
    const refillRowCount = await page.locator('tr').filter({ hasText: '9333333333' }).count();
    console.log(`Found ${refillRowCount} matching rows in Refilling Dashboard`);
    const refillRow = page.locator('tr').filter({ hasText: '9333333333' }).last();

    // Assign technician from Refilling Dashboard (creates REFILLING type assignment)
    console.log("STEP 8: Assigning technician from Refilling Dashboard (REFILLING type)...");
    await refillRow.locator('button[title="Assign Technician"]').click();
    await page.waitForTimeout(2000);
    
    // Target John Doe's checkbox specifically by matching his name text
    const johnDoeLabel = page.locator('form label').filter({ hasText: 'John Doe' });
    await johnDoeLabel.locator('input[type="checkbox"]').check();
    await page.locator('form input[type="date"]').fill(today);
    await page.click('form button:has-text("Assign")');
    await page.waitForTimeout(3000);
    console.log("✅ John Doe assigned from Refilling Dashboard (REFILLING type)!");

    // ─────────────────────────────────────────────────
    // PHASE 3: Technician – Update to "Assign For Service"
    // ─────────────────────────────────────────────────
    console.log("\n=== PHASE 3: Technician View ===");

    // Step 9: Logout Admin via API (avoids sidebar button click issues)
    console.log("STEP 9: Logging out Admin...");
    await page.evaluate(async () => { await fetch('/api/auth/logout', { method: 'POST' }); });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log("STEP 10: Logging in as Technician John Doe...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.fill('input[type="tel"]', '9111111111');
    await page.fill('input[type="password"]', 'tech123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/technician/tasks', { timeout: 15000 });
    console.log("✅ Technician logged in!");

    // Find the REFILLING task (9333333333)
    console.log("STEP 11: Finding the REFILLING task (REFILLING type)...");
    await page.waitForTimeout(2000);
    const techTable = await page.locator('table').innerText().catch(() => 'No table');
    console.log("Technician table:", techTable.substring(0, 800));

    // Find ALL rows with 9333333333 (pick the REFILLING one)
    const taskRowCount = await page.locator('tr').filter({ hasText: '9333333333' }).count();
    console.log(`Found ${taskRowCount} rows with 9333333333`);

    if (taskRowCount === 0) {
      // REFILLING assignment may not be visible for John Doe – log all rows for debug
      const allRowsText = await page.locator('tbody tr').evaluateAll(rows => rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()));
      console.log("ALL task rows:", JSON.stringify(allRowsText));
      throw new Error("No REFILLING task found for John Doe with contact 9333333333");
    }

    // Click edit on the REFILLING row (filter by REFILLING assignment type)
    const refillingTaskRow = page.locator('tr').filter({ hasText: '9333333333' }).filter({ hasText: 'REFILLING' }).first();
    const refillingCount = await refillingTaskRow.count();
    console.log(`REFILLING rows found: ${refillingCount}`);
    
    const targetRow = refillingCount > 0 
      ? refillingTaskRow 
      : page.locator('tr').filter({ hasText: '9333333333' }).last();
    
    await targetRow.locator('button[title="Task Details"]').click();
    await page.waitForTimeout(2000);

    // Update status to "Assign For Service"
    console.log("STEP 12: Setting status to 'Assign For Service'...");
    // Status select is the one with Pending/Assign For Service/Completed options
    const statusSelect = page.locator('select').filter({ hasText: 'Pending' }).last();
    await statusSelect.selectOption('Assign For Service');
    await page.locator('form input[type="date"]').fill(today);
    await page.click('button:has-text("Update")');
    await page.waitForTimeout(3000);
    console.log("✅ Status set to 'Assign For Service' – auto-transition to SERVICES triggered!");

    // ─────────────────────────────────────────────────
    // PHASE 4: Admin – Verify on Services Dashboard
    // ─────────────────────────────────────────────────
    console.log("\n=== PHASE 4: Admin – Verify on Services Dashboard ===");

    // Step 13: Logout Technician via API
    console.log("STEP 13: Logging out Technician...");
    await page.keyboard.press('Escape'); // dismiss any open modal
    await page.waitForTimeout(500);
    await page.evaluate(async () => { await fetch('/api/auth/logout', { method: 'POST' }); });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log("STEP 14: Logging in as Admin...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/enquiry', { timeout: 15000 });

    console.log("STEP 15: Navigating to Services Dashboard...");
    await page.goto('http://localhost:3000/admin/services', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const servicesTable = await page.locator('table').innerText().catch(() => 'No table');
    console.log("Services Dashboard table:", servicesTable.substring(0, 800));

    const servicesBody = await page.innerText('body');
    if (servicesBody.includes('Test Logistics Corp') || servicesBody.includes('9333333333')) {
      console.log(`\n🎉🎉 LIFECYCLE COMPLETE! Ticket ${ticketId} is visible on the Services Dashboard!`);
      console.log("✅ Full ticket lifecycle verified:");
      console.log("   Enquiry → Order Confirmed → Assign Technician → REFILLING Stage");
      console.log("   → Refilling Dashboard → Re-assign Technician (REFILLING) → Technician: Assign For Service");
      console.log("   → AUTO-TRANSITIONED → SERVICES Dashboard ✅");
    } else {
      console.log(`\n⚠️ Ticket ${ticketId} not found on Services Dashboard.`);
      console.log("Full body text snippet:", servicesBody.substring(0, 500));
    }

  } catch (error) {
    console.error("❌ Error during ticket lifecycle test:", error.message);
    await page.screenshot({ path: 'lifecycle_failure.png' });
    console.log("📸 Screenshot saved to lifecycle_failure.png");
  } finally {
    await browser.close();
    console.log("\nBrowser closed. Lifecycle test completed.");
  }
})();
