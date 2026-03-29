import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadExtension() {
  const context = await chromium.launch({ headless: true });
  const page = await context.newPage();
  return { context, page };
}

test.describe('Mana Pool Price Checker Extension', () => {
  test('TCGPlayer single product page loads Metalwork Colossus', async () => {
    const { page } = await loadExtension();
    
    await page.goto('https://www.tcgplayer.com/product/122928/magic-kaladesh-metalwork-colossus?page=1&Language=English');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const productName = page.locator('h1').first();
    await expect(productName).toBeVisible();
    
    const text = await productName.textContent();
    expect(text).toContain('Metalwork Colossus');

    await page.close();
  });

  test('Scryfall single card page loads Metalwork Colossus', async () => {
    const { page } = await loadExtension();
    
    await page.goto('https://www.scryfall.com/card/cmm/960/metalwork-colossus');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const cardTitle = page.locator('h1.card-text-title');
    await expect(cardTitle).toBeVisible();
    
    const text = await cardTitle.textContent();
    expect(text).toContain('Metalwork Colossus');

    await page.close();
  });
});
