import { test, expect } from '@playwright/test';

test('two private browser identities capture together and recover shared photos after refresh', async ({ browser, page }) => {
  test.skip(!process.env.FLASHBACK_BACKEND_TEST, 'Requires a configured live backend.');
  test.setTimeout(180000);
  const partnerContext = await browser.newContext();
  const partner = await partnerContext.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message)); partner.on('pageerror', error => errors.push(error.message));
  let id = '';
  try {
    await page.goto('/#couple-create');
    await page.getByPlaceholder('Your name / your city').fill('Host / Manila');
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: /Laundry Late-night/ }).click();
    await page.getByRole('button', { name: 'CREATE SESSION', exact: true }).click();
    const input = page.locator('.invite-link-box input');
    await expect(input).toBeVisible();
    const invite = await input.inputValue(); id = new URL(invite).searchParams.get('join')!;
    await partner.goto(invite);
    await partner.getByPlaceholder('Your name / your city').fill('Partner / Tokyo');
    await partner.getByRole('button', { name: 'JOIN SESSION', exact: true }).click();
    await expect(page.getByRole('button', { name: 'START SYNCED CAPTURE' })).toBeEnabled({ timeout: 30000 });
    await expect(partner.locator('.couple-session-camera')).toHaveAttribute('data-room', 'laundry');
    for (let shot = 1; shot <= 3; shot++) {
      await page.getByRole('button', { name: 'START SYNCED CAPTURE' }).click();
      await expect(page.locator('.photo-column').first().locator('img')).toHaveCount(shot, { timeout: 30000 });
      await expect(partner.locator('.photo-column').first().locator('img')).toHaveCount(shot, { timeout: 30000 });
      await expect(page.locator('.photo-column').nth(1).locator('img')).toHaveCount(shot, { timeout: 30000 });
      if (shot < 3) await expect(page.getByRole('button', { name: 'START SYNCED CAPTURE' })).toBeEnabled();
    }
    await partner.reload();
    await expect(partner.locator('.photo-column').first().locator('img')).toHaveCount(3, { timeout: 30000 });
    await expect(partner.locator('.photo-column').nth(1).locator('img')).toHaveCount(3, { timeout: 30000 });
    await page.getByRole('button', { name: 'GENERATE STRIP' }).click();
    await expect(page.locator('.photo-strip img')).toHaveAttribute('src', /^data:image/, { timeout: 30000 });
    await partner.getByRole('button', { name: 'GENERATE STRIP' }).click();
    await expect(partner.locator('.photo-strip img')).toHaveAttribute('src', /^data:image/, { timeout: 30000 });
    expect(errors).toEqual([]);
  } finally {
    if (id && !process.env.APP_BASE_URL) await page.evaluate(async id => {
      const { requireBackend } = await import('/src/lib/supabase.ts');
      const { error } = await requireBackend().from('couple_sessions').delete().eq('id', id);
      if (error) throw error;
    }, id);
    if (errors.length) console.error(errors);
    await partner.screenshot({ path: 'test-results/partner-session.png', fullPage: true });
    await partnerContext.close();
  }
});
