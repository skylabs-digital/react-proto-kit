/**
 * Quick validation script using Playwright
 * Run with: node test-example.mjs
 */

import { chromium } from 'playwright';

async function test() {
  console.log('🚀 Starting Playwright test...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Check if error component is visible
    const hasError = await page.locator('text=Something went wrong').isVisible().catch(() => false);
    
    if (hasError) {
      console.log('❌ Error component is visible - ApiClientProvider issue detected\n');
      
      // Take screenshot
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Screenshot saved to error-screenshot.png\n');
      
      await browser.close();
      process.exit(1);
    }

    // Check if todos are visible
    const todosVisible = await page.locator('text=Todos (').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!todosVisible) {
      console.log('⚠️  Todos not visible\n');
      await page.screenshot({ path: 'no-todos-screenshot.png' });
      await browser.close();
      process.exit(1);
    }

    console.log('✅ Todos are visible!\n');

    // Test tab navigation
    console.log('🔄 Testing tab navigation...');
    
    // Click Completed tab
    await page.click('button:has-text("Completed")');
    await page.waitForTimeout(1000);
    
    // Check URL changed
    const url = page.url();
    if (!url.includes('status=completed')) {
      console.log('❌ URL did not change to status=completed\n');
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ URL changed to:', url);

    // Check for fetching indicator
    const isFetching = await page.locator('text=🔄 Fetching...').isVisible({ timeout: 2000 }).catch(() => false);
    if (isFetching) {
      console.log('✅ Fetching indicator appeared!');
    }

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Click Archived tab
    await page.click('button:has-text("Archived")');
    await page.waitForTimeout(1000);

    if (!page.url().includes('status=archived')) {
      console.log('❌ URL did not change to status=archived\n');
      await browser.close();
      process.exit(1);
    }

    console.log('✅ URL changed to:', page.url());

    // Click Active tab
    await page.click('button:has-text("Active")');
    await page.waitForTimeout(1000);

    if (!page.url().includes('status=active')) {
      console.log('❌ URL did not change to status=active\n');
      await browser.close();
      process.exit(1);
    }

    console.log('✅ URL changed to:', page.url());

    console.log('\n✅ All tests passed! watchSearchParams is working correctly! 🎉\n');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error-screenshot.png' });
    console.log('📸 Screenshot saved to test-error-screenshot.png\n');
    await browser.close();
    process.exit(1);
  }
}

test();
