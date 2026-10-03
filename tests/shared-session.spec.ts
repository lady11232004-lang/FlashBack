import { test, expect } from '@playwright/test';

test('two private browser identities capture together and recover shared photos after refresh', async ({ browser, page }) => {
  test.skip(!process.env.FLASHBACK_BACKEND_TEST, 'Requires a configured live backend.');
  test.setTimeout(180000);
  const partnerContext = await browser.newContext();
  const partner = await partnerContext.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message)); partner.on('pageerror', error => errors.push(error.message));
  let id = '';
  let interruptPhoto = false;
  await page.route('**/rest/v1/couple_sessions*', async route => {
    if (interruptPhoto && route.request().method() === 'PATCH' && route.request().postData()?.includes('host_photos')) { interruptPhoto = false; await route.abort('failed'); }
    else await route.continue();
  });
  try {
    await page.goto('/#gallery');
    await page.getByRole('button',{name:'LONG-DISTANCE MODE',exact:true}).click();
    await page.locator('.template-card-choice').filter({hasText:'Minimal'}).click();
    await page.getByPlaceholder('Your name / your city').fill('Host / Manila');
    await page.getByRole('button', { name: '3', exact: true }).click();

    await page.getByRole('button', { name: 'CREATE SESSION', exact: true }).click();
    const input = page.locator('.invite-link-box input');
    await expect(input).toBeVisible();
    const invite = await input.inputValue(); id = new URL(invite).searchParams.get('join')!;
    await partner.goto(invite);
    await partner.getByPlaceholder('Your name / your city').fill('Partner / Tokyo');
    await partner.getByRole('button', { name: 'JOIN SESSION', exact: true }).click();
    await page.setViewportSize({width:1101,height:850});
    await partner.setViewportSize({width:1024,height:850});
    await expect(page.getByRole('slider', {name:'Camera zoom'})).toBeVisible();
    await expect(partner.locator('.frame-picker')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Take synced photo' })).toBeEnabled({ timeout: 30000 });
    await expect(partner.locator('.couple-session-camera')).toHaveAttribute('data-room', 'classic');
    await page.getByRole('button', { name: 'Warm', exact: true }).click();
    await expect(page.locator('video')).toHaveCSS('filter', /sepia/);
    await expect(page.locator('.side-template-item,.frame-picker')).toHaveCount(0);
    for (let shot = 1; shot <= 3; shot++) {
      interruptPhoto = shot === 2;
      await page.getByRole('button', { name: 'Take synced photo' }).click();
      await Promise.all([expect(page.locator('.countdown-overlay')).toBeVisible({ timeout: 10000 }), expect(partner.locator('.countdown-overlay')).toBeVisible({ timeout: 10000 })]);
      if (shot === 2) { await expect(page.getByRole('button', { name: 'RETRY PHOTO SYNC' })).toBeVisible({ timeout: 30000 }); await page.getByRole('button', { name: 'RETRY PHOTO SYNC' }).click(); }
      await expect(page.locator('.photo-column').first().locator('img')).toHaveCount(shot, { timeout: 30000 });
      await expect(partner.locator('.photo-column').first().locator('img')).toHaveCount(shot, { timeout: 30000 });
      await expect(page.locator('.photo-column').nth(1).locator('img')).toHaveCount(shot, { timeout: 30000 });
      if (shot < 3) await expect(page.getByRole('button', { name: 'Take synced photo' })).toBeEnabled();
    }
    await partner.reload();
    await expect(partner.locator('.photo-column').first().locator('img')).toHaveCount(3, { timeout: 30000 });
    await expect(partner.locator('.photo-column').nth(1).locator('img')).toHaveCount(3, { timeout: 30000 });
    await page.getByRole('button', { name: 'GENERATE STRIP' }).click();
    await expect(page.locator('.photo-strip img')).toHaveAttribute('src', /^data:image/, { timeout: 30000 });
    await expect(page.locator('.metadata')).toContainText('Minimal');
    await expect(page.locator('.side-filter-item')).toHaveCount(0);
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
