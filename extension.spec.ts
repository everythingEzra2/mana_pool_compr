import { test, expect, chromium } from '@playwright/test';

test.describe('Mana Pool Price Checker Extension', () => {
  test('click works with plain text', async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.addStyleTag({
      content: `
        .mp-dot-inner {
          display: flex;
          width: auto;
          max-width: 200px;
          padding: 0 10px;
          background: #10b981;
          cursor: pointer;
          pointer-events: auto;
        }
      `
    });
    
    await page.setContent(`
      <html><body>
        <div class="mp-price-dot mp-success">
          <div class="mp-dot-inner">Mana Pool: $1.00</div>
        </div>
      </body></html>
    `);
    
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.evaluate(() => {
      const dot = document.querySelector('.mp-price-dot') as HTMLElement;
      const inner = document.querySelector('.mp-dot-inner') as HTMLElement;
      dot.dataset.setCode = 'mma';
      dot.dataset.cardNumber = '210';
      inner.onclick = function(e: Event) {
        e.stopPropagation();
        const setCode = dot.dataset.setCode;
        const cardNumber = dot.dataset.cardNumber;
        if (setCode && cardNumber) {
          console.log('GO! ' + setCode + '/' + cardNumber);
        }
      };
    });
    
    await page.locator('.mp-dot-inner').click({ force: true });
    await page.waitForTimeout(300);
    
    expect(consoleLogs.some(l => l.includes('GO!'))).toBe(true);
    await browser.close();
  });
});
