
import { test, expect } from '@playwright/test';

test.use({ ignoreHTTPSErrors: true });

test.describe('App Basic Functionality', () => {
  test('should load the app and login', async ({ page }) => {
    // 1. Load the page (simulated localhost)

    // Ignore HTTPS errors for localhost
    await page.goto('https://localhost:5173/pequenospassos/', { waitUntil: 'networkidle' });

    // 2. Check for Profile Creation
    // Correct selector from index.html: id="profile-email-input"
    const profileInput = page.locator('#profile-email-input');
    await expect(profileInput).toBeVisible();

    // 3. Create a profile
    await profileInput.fill('test@example.com');
    await page.click('#login-btn');

    // 4. Verify Dashboard Loads
    // Wait for the profile widget to be visible, which indicates login success
    await expect(page.locator('#user-profile-widget')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#user-profile-name')).toHaveText('test');

    // 5. Navigate to Tasks
    await page.click('a[href="#tarefas"]');
    // Wait for the page content to update
    await expect(page.locator('#page-tarefas')).toBeVisible();

    // 6. Navigate to Fisica page using hash directly to avoid sidebar interaction issues
    await page.goto('https://localhost:5173/pequenospassos/#fisica');
    // Use the h1 text which is "PDCA Saúde Física" in fisica.html, not "Saúde Física" h2
    await expect(page.locator('h1').filter({ hasText: 'PDCA Saúde Física' })).toBeVisible();

    // 7. Check if tasks are present (default tasks should be added for new profile)
    await page.goto('https://localhost:5173/pequenospassos/#planejamento-diario');
    // Wait for the daily planning page
    await expect(page.locator('#page-planejamento-diario')).toBeVisible();
    // Check for at least one task block (class="task-block") which is what planejamento-diario uses
    await expect(page.locator('.task-block').first()).toBeVisible();
  });
});
