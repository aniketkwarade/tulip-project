import { test, expect } from '@playwright/test';

async function explore(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toHaveJSProperty('hidden', true);
  await expect(page.locator('#app-container')).not.toHaveAttribute('inert');
}

test('logo returns home and resets the selected category without opening a random topic', async ({ page }) => {
  await explore(page);
  await page.locator('[data-filter="oceans"]').click();
  const logo = page.getByRole('link', { name: 'Tulip Earth home' });
  await logo.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'explore');
  await expect(page.locator('[data-filter="all"]')).toHaveClass(/active/);
  await expect(logo.locator('img')).toHaveAttribute('src', '/tulip-earth-white.svg');
  await page.goto('/?node=methane');
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'study');
  await logo.click();
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'explore');
  await expect(page).not.toHaveURL(/node=/);
});

test('category rail retains selection colors and footer starts the guide', async ({ page }) => {
  await explore(page);
  const rail = page.locator('#filter-bar');
  await expect(rail).toHaveCSS('border-radius', '999px');
  await page.locator('[data-filter="oceans"]').click();
  await expect(page.locator('[data-filter="oceans"]')).toHaveCSS('background-color', 'rgb(70, 190, 235)');
  await expect(page.locator('[data-filter="all"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.locator('[data-filter="biosphere"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-filter="biosphere"]')).toHaveCSS('background-color', 'rgb(105, 205, 135)');
  await page.locator('#footer-quick-start').click();
  await expect(page.locator('body')).toHaveAttribute('data-guide-step', '0');
  await page.keyboard.press('Escape');
  await expect(page.locator('#desktop-guide')).toBeHidden();
});
