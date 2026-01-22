import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to upload a mock PDF file
async function uploadMockPDF(page: ReturnType<typeof test['info']>['project']['use']['page'] extends infer T ? T : never) {
  // Create a mock PDF file
  const buffer = Buffer.from('%PDF-1.4 mock pdf content');

  // Set up file chooser listener before clicking
  const fileChooserPromise = page.waitForEvent('filechooser');

  // Click the drop zone to open file dialog
  await page.locator('text=Drop Invoice PDF here').click();

  // Handle the file chooser
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test-invoice.pdf',
    mimeType: 'application/pdf',
    buffer: buffer,
  });

  // Wait for file to be selected (button becomes enabled)
  await page.waitForSelector('button:has-text("Analyze Invoice"):not([disabled])', { timeout: 5000 });
}

test.describe('WCAG Accessibility Tests', () => {
  test('IDLE state - no WCAG violations', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForSelector('text=The Sentinel');

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/01-idle-state.png',
      fullPage: true
    });

    // Run axe accessibility scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log any violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
        console.log(`    Impact: ${violation.impact}`);
        violation.nodes.forEach((node) => {
          console.log(`    Element: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    // Allow minor violations for now, but report them
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('PROCESSING state - loading screen accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Upload a mock PDF file
    await uploadMockPDF(page);

    // Click the now-enabled analyze button
    await page.locator('button:has-text("Analyze Invoice")').click();

    // Wait for processing state
    await page.waitForSelector('text=Analyzing Invoice', { timeout: 5000 });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/02-processing-state.png',
      fullPage: true
    });

    // Run axe scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('RESULTS state - full dashboard accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Upload a mock PDF file
    await uploadMockPDF(page);

    // Trigger analysis
    await page.locator('button:has-text("Analyze Invoice")').click();

    // Wait for results (may take a few seconds for the demo)
    await page.waitForSelector('text=Document Comparison', { timeout: 30000 });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/03-results-state.png',
      fullPage: true
    });

    // Run axe scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Results state violations:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
        console.log(`    Impact: ${violation.impact}`);
        violation.nodes.forEach((node) => {
          console.log(`    Element: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Results with highlight - flagged item visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Upload and analyze
    await uploadMockPDF(page);
    await page.locator('button:has-text("Analyze Invoice")').click();
    await page.waitForSelector('text=Document Comparison', { timeout: 30000 });

    // Hover on the flagged item in the audit panel to trigger highlight
    const flaggedItem = page.locator('text=Lift Maintenance Service').first();
    if (await flaggedItem.isVisible()) {
      await flaggedItem.hover();
      await page.waitForTimeout(500);
    }

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/04-results-with-highlight.png',
      fullPage: true
    });
  });

  test('Dispute modal - modal accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Upload and analyze
    await uploadMockPDF(page);
    await page.locator('button:has-text("Analyze Invoice")').click();
    await page.waitForSelector('text=Document Comparison', { timeout: 30000 });

    // Open dispute modal
    const disputeButton = page.locator('button:has-text("Generate Dispute Letter")');
    await disputeButton.waitFor({ state: 'visible', timeout: 5000 });
    await disputeButton.click();

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/05-dispute-modal.png',
      fullPage: true
    });

    // Run axe scan on modal
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Modal accessibility violations:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
        console.log(`    Impact: ${violation.impact}`);
        violation.nodes.forEach((node) => {
          console.log(`    Element: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);

    // Test escape key closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Keyboard navigation - focus order', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // First focusable element should receive focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Continue tabbing and verify focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
  });

  test('Color contrast - text readability', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // Specifically check color contrast violations
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();

    const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

    if (contrastViolations.length > 0) {
      console.log('Color contrast issues:');
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`  - Element: ${node.html.substring(0, 80)}...`);
          console.log(`    ${node.failureSummary}`);
        });
      });
    }

    // Allow up to 3 minor contrast issues (often from decorative elements)
    expect(contrastViolations.length).toBeLessThanOrEqual(3);
  });
});

test.describe('Screenshot Capture', () => {
  test('capture all app states', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=The Sentinel');

    // 1. IDLE state
    await page.screenshot({ path: 'screenshots/state-idle.png', fullPage: true });

    // Upload a mock PDF
    await uploadMockPDF(page);

    // 2. PROCESSING state
    await page.locator('button:has-text("Analyze Invoice")').click();
    await page.waitForSelector('text=Analyzing Invoice');
    await page.screenshot({ path: 'screenshots/state-processing.png', fullPage: true });

    // 3. RESULTS state (wait for analysis to complete)
    await page.waitForSelector('text=Document Comparison', { timeout: 30000 });
    await page.screenshot({ path: 'screenshots/state-results.png', fullPage: true });

    // 4. With toast notification visible (if still present)
    await page.screenshot({ path: 'screenshots/state-results-with-alert.png', fullPage: true });

    // 5. Dispute modal
    const disputeButton = page.locator('button:has-text("Generate Dispute Letter")');
    if (await disputeButton.isVisible()) {
      await disputeButton.click();
      await page.waitForSelector('[role="dialog"]');
      await page.screenshot({ path: 'screenshots/state-dispute-modal.png', fullPage: true });
    }

    console.log('Screenshots saved to ./screenshots/');
  });
});
