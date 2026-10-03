import { test, expect, type Page } from '@playwright/test';

async function capture(page: Page) {
  await page.goto('/#preview');
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: 'Start capture', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Take photo', exact: true }).click();
    await expect(page.locator('.shot-boxes img')).toHaveCount(index + 1, { timeout: 10000 });
  }
}

test('navigation, invites and backend-unavailable state are honest', async ({ page }) => {
  test.skip(Boolean(process.env.FLASHBACK_BACKEND_TEST), 'Backend is enabled in this run.');
  await page.goto('/?join=791127e7-366f-4331-ab61-a03522ee5101');
  await expect(page.getByRole('heading', { name: /JOIN YOUR/ })).toBeVisible();
  await page.getByPlaceholder('Your name / your city').fill('Partner');
  await expect(page.getByRole('button', { name: 'JOIN SESSION', exact: true })).toBeDisabled();
  await expect(page.getByText(/Long-distance sessions require/)).toBeVisible();
  expect(new URL(page.url()).searchParams.has('join')).toBeTruthy();
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'YOUR PRIVACY.' })).toBeVisible();
  await page.getByRole('button', { name: 'Terms', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'USING FLASHBACK.' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'YOUR PRIVACY.' })).toBeVisible();
});

for (const width of [1440, 1280, 768, 390]) {
  test(`responsive navigation and capture tools at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['home', 'about', 'gallery', 'modes', 'preview', 'couple-create', 'privacy', 'terms']) {
      await page.goto(`/#${view}`);
      await expect(page.locator('.site-header')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), view).toBeTruthy();
      if (view === 'preview') await expect(page.locator('.side-tools-panel')).toBeVisible();
      if (view === 'home' || view === 'preview') await page.screenshot({ path: `test-results/${view}-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'FLASHBACK', exact: true }).click();
    if (width <= 900) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.locator('nav').getByRole('button', { name: 'TEMPLATES', exact: true }).click();
    await expect(page.getByRole('heading', { name: /CHOOSE YOUR TEMPLATE/ })).toBeVisible();
  });
}

test('denied camera access shows actionable error and disables capture', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5187/#preview');
  await expect(page.getByText(/Camera permission denied/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start capture', exact: true })).toBeDisabled();
  await context.close();
});

test('every filter and editor category remains usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await capture(page);
  await page.getByRole('button', { name: 'DONE — SELECT PHOTOS' }).click();
  await expect(page.locator('.select-card')).toHaveCount(3);
  for (const card of await page.locator('.select-card').all()) await card.click();
  await page.getByRole('button', { name: 'CONTINUE TO CUSTOMIZE' }).click();
  for (const template of await page.locator('.edit-section .template').all()) {
    const previous = await page.locator('.photo-strip img').getAttribute('src');
    await template.click();
    await expect(template).toHaveClass(/selected/);
    if (await template.getAttribute('class') && previous) await expect(page.locator('.photo-strip img')).toHaveAttribute('src', /^data:image/);
  }
  for (const category of ['BACKGROUND', 'BORDER', 'TEXT', 'STICKERS', 'ORIENTATION']) {
    await page.getByRole('button', { name: category, exact: true }).click();
    for (const button of await page.locator('.edit-section .color-swatch, .edit-section .texture-item, .edit-section .border-item, .edit-section .orientation-card').all()) {
      await button.click(); await expect(button).toHaveClass(/selected/);
    }
    if (category === 'TEXT') {
      for (const input of await page.locator('.text-custom input:not([type=checkbox]):not([type=range])').all()) await input.fill('Memory');
    }
    if (category === 'STICKERS') {
      for (const sticker of await page.locator('.sticker-btn').all()) await sticker.click();
      await page.getByRole('button', { name: /CLEAR STICKERS/ }).click();
      await expect(page.getByRole('button', { name: /CLEAR STICKERS/ })).toHaveCount(0);
    }
  }
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await expect(page.locator('.edit-section .orientation-card').first()).toHaveClass(/selected/);
  await page.getByRole('button', { name: 'NEXT STEP' }).click();
  await expect(page.locator('img.final-strip')).toHaveAttribute('src', /^data:image/);
  await page.getByRole('button', { name: 'TAKE ANOTHER', exact: true }).first().click();
  await page.goto('/#preview');
  for (const filter of await page.locator('.side-filter-item').all()) {
    await filter.click(); await expect(filter).toHaveClass(/selected/);
  }
  for (const template of await page.locator('.side-template-item').all()) {
    await template.click(); await expect(template).toHaveClass(/selected/);
  }
  await page.getByRole('button', { name: 'Switch camera', exact: true }).click();
  await expect(page.getByText('REAR', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('capture limit and cancellation prevent extra or late shots', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/#preview');
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start capture', exact: true }).click();
  for (let index = 0; index < 10; index++) {
    await page.getByRole('button', { name: 'Take photo', exact: true }).click();
    await expect(page.locator('.shot-boxes img')).toHaveCount(index + 1, { timeout: 10000 });
  }
  await expect(page.getByRole('button', { name: 'Take photo' })).toBeDisabled();
  await page.reload();
  await expect(page.locator('.shot-boxes img')).toHaveCount(10);
  await page.locator('nav').getByRole('button', { name: 'BOOK', exact: true }).click();
  await page.goto('/#preview');
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start capture', exact: true }).click();
  await page.getByRole('button', { name: 'Take photo', exact: true }).click();
  await page.locator('nav').getByRole('button', { name: 'ABOUT', exact: true }).click();
  await page.waitForTimeout(3500);
  await page.goto('/#session');
  await expect(page.locator('.shot-boxes img')).toHaveCount(0);
});
